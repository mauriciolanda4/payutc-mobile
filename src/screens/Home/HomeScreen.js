/**
 * @author Arthur Martello <arthur.martello@etu.utc.fr>
 * @author Samy Nastuzzi <samy@nastuzzi.fr>
 *
 * @copyright Copyright (c) 2019, SiMDE-UTC
 * @license GPL-3.0
 */

import React from 'react';
import { Alert, FlatList, RefreshControl, Text, ScrollView, View } from 'react-native';
import colors from '../../styles/colors';
import Hi from '../../components/Home/Hi';
import Balance from '../../components/Home/Balance';
import BlockTemplate from '../../components/BlockTemplate';
import { _, Home as t } from '../../utils/i18n';
import Item from '../../components/History/Item';
import PayUTC from '../../services/PayUTC';

export default class HomeScreen extends React.PureComponent {
	static navigationOptions = {
		title: t('title'),
		header: null,
		headerForceInset: { top: 'never' },
	};

	constructor(props) {
		super(props);

		this.state = {
			wallet: null,
			walletFetching: false,
			history: null,
			historyFetching: false,
		};

		this.onRefresh = this.onRefresh.bind(this);
	}

	componentDidMount() {
		this.getWalletDetails();
		this.getHistory();
	}

	onRefresh() {
		this.getWalletDetails();
		this.getHistory();
	}

	getWalletDetails() {
		this.setState({ walletFetching: true });

		PayUTC.getWalletDetails().then(([wallet]) => {
			if (wallet && wallet.error != null) {
				Alert.alert(_('error'), t('cannot_fetch_wallet'), [{ text: _('ok') }], {
					cancelable: true,
				});
			} else {
				this.setState({ wallet, walletFetching: false });
			}
		});
	}

	getHistory() {
		this.setState({ historyFetching: true });

		PayUTC.getHistory().then(([{ historique }]) => {
			this.setState({ history: historique, historyFetching: false });
		});
	}

	render() {
		const { walletFetching, historyFetching, wallet, history } = this.state;
		const { navigation } = this.props;

		return (
			<View
				style={{
					flex: 1,
					flexDirection: 'column',
					padding: 15,
					backgroundColor: colors.backgroundLight,
				}}
			>
				<View>
					<View style={{ paddingBottom: 15 }}>
						<Hi
							name={wallet && wallet.first_name ? wallet.first_name : null}
							onRefresh={this.onRefresh}
						/>
					</View>
					<ScrollView
						style={{ paddingBottom: 15 }}
						refreshControl={
							<RefreshControl
								refreshing={walletFetching}
								onRefresh={() => this.onRefresh()}
								colors={[colors.secondary]}
								tintColor={colors.secondary}
							/>
						}
					>
						<Balance
							amount={wallet && wallet.credit ? wallet.credit / 100 : null}
							navigation={navigation}
						/>
					</ScrollView>
					<View>
						<BlockTemplate roundedTop shadow>
							<Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.primary }}>
								{t('recent_activity')}
							</Text>
						</BlockTemplate>
						<View style={{ borderColor: colors.backgroundLight, height: 1 }} />
					</View>
				</View>
				<FlatList
					data={history ? history.slice(0, 10) : null}
					keyExtractor={item => item.id.toString()}
					renderItem={({ item, index }) => (
						<Item
							transaction={item}
							customBackground={index % 2 === 0 ? colors.backgroundBlockAlt : null}
						/>
					)}
					ListEmptyComponent={() => (
						<BlockTemplate>
							<Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.disabled }}>
								{_('loading_text_replacement')}
							</Text>
						</BlockTemplate>
					)}
					ItemSeparatorComponent={() => (
						<View style={{ borderColor: colors.backgroundLight, height: 1 }} />
					)}
					refreshControl={
						<RefreshControl
							refreshing={historyFetching}
							onRefresh={() => this.onRefresh()}
							colors={[colors.secondary]}
							tintColor={colors.secondary}
						/>
					}
				/>
				<View>
					<View style={{ borderColor: colors.backgroundLight, height: 1 }} />
					<BlockTemplate roundedBottom onPress={() => navigation.navigate('History')}>
						<Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.primary }}>
							{t('all_history')}
						</Text>
					</BlockTemplate>
				</View>
			</View>
		);
	}
}
