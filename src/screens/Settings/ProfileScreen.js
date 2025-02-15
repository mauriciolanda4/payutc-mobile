/**
 * @author Samy Nastuzzi <samy@nastuzzi.fr>
 *
 * @copyright Copyright (c) 2019, SiMDE-UTC
 * @license GPL-3.0
 */

import React from 'react';
import { Alert, Linking, RefreshControl, ScrollView, Text, View } from 'react-native';
import { connect } from 'react-redux';
import colors from '../../styles/colors';
import LinkButton from '../../components/LinkButton';
import List from '../../components/List';
import BlockTemplate from '../../components/BlockTemplate';
import Message from '../../components/Message';
import SwitchBlockTemplate from '../../components/SwitchBlockTemplate';
import { beautifyDateTime } from '../../utils/date';
import { _, Profile as t } from '../../utils/i18n';
import PortailService from '../../services/Portail';
import { Config, Ginger, PayUTC } from '../../redux/actions';
import Paragraphe from '../../components/Paragraphe';

class ProfileScreen extends React.Component {
	static navigationOptions = () => ({
		title: t('title'),
		headerStyle: { borderBottomWidth: 0 },
		headerForceInset: { top: 'never' },
		headerTintColor: colors.primary,
		headerTruncatedBackTitle: _('back'),
	});

	constructor(props) {
		super(props);

		this.state = { message: {} };

		this.onLockChange = this.onLockChange.bind(this);
		this.handleNavigationOnFocus = this.handleNavigationOnFocus.bind(this);
	}

	componentDidMount() {
		const { navigation } = this.props;

		this.onRefresh();

		this.subscriptions = [navigation.addListener('willFocus', this.handleNavigationOnFocus)];
	}

	componentWillUnmount() {
		this.subscriptions.forEach(subscription => subscription.remove());
	}

	onRefresh() {
		const {
			rightsFetching,
			hasRightsFetching,
			detailsFetching,
			isContributorFetching,
			dispatch,
		} = this.props;

		if (!detailsFetching) {
			dispatch(PayUTC.getWalletDetails());
		}

		if (!rightsFetching) {
			dispatch(PayUTC.getUserRights());
		}

		if (!hasRightsFetching) {
			dispatch(PayUTC.hasRights());
		}

		if (!isContributorFetching) {
			dispatch(Ginger.getInformation());
		}
	}

	onLockChange(value) {
		const { dispatch, detailsFetching } = this.props;

		if (detailsFetching) {
			return;
		}

		dispatch(
			Config.spinner({
				visible: true,
				textContent: value ? t('locking') : t('unlocking'),
			})
		);

		PayUTC.setLockStatus(value).payload.then(([status]) => {
			dispatch(
				Config.spinner({
					visible: false,
				})
			);

			if (status !== true && status !== false) {
				Alert.alert(
					_('error'),
					value ? t('lock_error') : t('unlock_error'),
					[{ text: _('ok') }],
					{}
				);

				return;
			}

			this.onRefresh();

			this.srollView.scrollTo({ x: 0, y: 0, animated: true });

			this.setState({
				message: {
					message: value ? t('lock_confirmed') : t('unlock_confirmed'),
				},
			});
		});
	}

	static renderDetail(
		{ title, titleColor, subtitle, value, onPress },
		index,
		roundedBottom = false
	) {
		return (
			<BlockTemplate
				customBackground={index % 2 === 0 ? colors.backgroundBlockAlt : colors.backgroundBlock}
				roundedBottom={roundedBottom}
				onPress={onPress}
			>
				<View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
					<Text style={{ fontSize: 14, fontWeight: 'bold', color: titleColor || colors.secondary }}>
						{title}
					</Text>
					<Text style={{ fontSize: 12, color: colors.secondary, marginLeft: 10 }}>{value}</Text>
				</View>
				{subtitle ? (
					<Text style={{ fontSize: 11, color: colors.secondary, marginTop: 3 }}>{subtitle}</Text>
				) : null}
			</BlockTemplate>
		);
	}

	getUserDetails() {
		const { hasRights, rights, details, detailsFetching, isContributor } = this.props;
		const types = [];

		if (detailsFetching) {
			return [];
		}

		if (rights.includes('ADMINRIGHT')) {
			types.push(_('admin'));
		} else if (rights.length) {
			types.push(_('manager'));
		} else if (hasRights) {
			types.push(_('staff'));
		}

		types.push(details.user.username.includes('@') ? _('ext') : _('cas'));

		return [
			{ title: _('firstname'), value: details.user.first_name },
			{ title: _('lastname'), value: details.user.last_name },
			{ title: _('email'), value: details.user.email },
			{ title: _('login'), value: details.user.username },
			{ title: _('type'), value: types.join(' / ') },
			{ title: _('status'), value: details.force_adult ? _('adult') : _('minor') },
			{ title: _('creation_date'), value: beautifyDateTime(details.created) },
			{
				title: t(isContributor ? 'is_contributor' : 'is_not_contributor'),
				titleColor: isContributor ? colors.secondary : colors.error,
				subtitle: t('contributor_desc'),
				onPress: isContributor ? null : () => Linking.openURL(PortailService.getContributeUrl()),
			},
		];
	}

	handleNavigationOnFocus({ action: { params } }) {
		this.setState({
			message: params || {},
		});

		this.srollView.scrollTo({ x: 0, y: 0, animated: true });
	}

	signOut() {
		const { navigation, dispatch } = this.props;

		PayUTC.forget().payload.then(() => {
			navigation.navigate('Auth');

			dispatch(Config.wipe());
		});
	}

	render() {
		const { details, detailsFetching, hasRights, navigation } = this.props;
		const { message } = this.state;

		return (
			<ScrollView
				refreshControl={
					<RefreshControl
						refreshing={detailsFetching}
						onRefresh={() => this.onRefresh()}
						colors={[colors.secondary]}
						tintColor={colors.secondary}
					/>
				}
				ref={ref => (this.srollView = ref)}
				style={{ backgroundColor: colors.backgroundLight }}
			>
				{message.message ? (
					<View style={{ margin: 15, marginBottom: 0 }}>
						<Message
							{...message}
							onPress={() => {
								if (message.onPress) {
									message.onPress();
								}

								this.setState({ message: {} });
							}}
						/>
					</View>
				) : null}

				<View style={{ margin: 15 }}>
					<List
						loading={detailsFetching}
						title={
							detailsFetching
								? _('loading_text_replacement')
								: `${details.user.first_name} ${details.user.last_name}`
						}
						renderItem={ProfileScreen.renderDetail}
						items={this.getUserDetails()}
						keyExtractor={item => item.title}
					/>
				</View>

				<SwitchBlockTemplate
					roundedTop
					roundedBottom
					shadow
					value={detailsFetching ? false : details.blocked}
					onValueChange={this.onLockChange}
					tintColor={colors.less}
					disabled={detailsFetching}
					style={{ margin: 15, marginTop: 0 }}
				>
					<View style={{ flex: 1, flexDirection: 'column' }}>
						<Text
							style={{
								fontSize: 16,
								fontWeight: 'bold',
								color: detailsFetching ? colors.disabled : colors.secondary,
							}}
						>
							{t('lock')}
						</Text>
						<Text
							style={{
								fontSize: 13,
								color: detailsFetching ? colors.disabled : colors.secondary,
							}}
						>
							{t('lock_info')}
						</Text>
					</View>
				</SwitchBlockTemplate>

				<Paragraphe
					style={{ margin: 15, marginTop: 0 }}
					title={t('change_pin')}
					description={t('change_pin_desc')}
					onPress={() => navigation.navigate('ChangePin')}
					disabled={!hasRights}
					disabledText={detailsFetching ? '' : t('cant_change_pin')}
					link
				/>

				<LinkButton
					text={t('sign_out')}
					color={colors.less}
					onPress={() => this.signOut()}
					style={{ margin: 15, marginTop: 0 }}
				/>
			</ScrollView>
		);
	}
}

const mapStateToProps = ({ payutc, ginger, config: { lang } }) => {
	const hasRights = payutc.hasRights();
	const rights = payutc.getUserRights();
	const details = payutc.getWalletDetails();
	const information = ginger.getInformation();

	return {
		lang,
		hasRights: hasRights.getData(false),
		hasRightsFetching: hasRights.isFetching(),
		rights: rights.getData([]),
		rightsFetching: rights.isFetching(),
		rightsFetched: rights.isFetched(),
		details: details.getData({}),
		detailsFetching: details.isFetching(),
		detailsFetched: details.isFetched(),
		isContributor: information.getData({ is_cotisant: false }).is_cotisant,
		isContributorFetching: information.isFetching(),
	};
};

export default connect(mapStateToProps)(ProfileScreen);
