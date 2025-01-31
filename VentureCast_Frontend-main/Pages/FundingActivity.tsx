import React, {useState} from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import FundingActivityItem from './Components/FundingActivityItem';
import Dropdown from './Components/Dropdown';
import formatCurrency from './Components/formatCurrency';


const FundingActivity = ({navigation}:any) => {

  const accountStats = 
    { totalDeposit: 166745.00, totalWithdrawn: 49528.00, netDeposit: 166745.00, netWithdrawn: 49400.00 };

  

  const ActivityData = [
    { id: '1', date: '12/24/2024', page: 'DepositOption', name: 'Chase', value: 73331.50, icon: require('../Assets/Icons/Chase.png') },
    { id: '2', date: '12/15/2024', page: 'DepositOption', name: 'Visa', value: -9000, icon: require('../Assets/Icons/Visa.png') },
    { id: '3', date: '11/30/2024', page: 'DepositOption', name: 'Wells Fargo', value: 2007.10,icon: require('../Assets/Icons/WellsFargo.png') },
  ];

  const num = ActivityData.length;

  const [displayedPositions, setDisplayedPositions] = useState(ActivityData);

  const handleSort = (type: string) => {
    const sortedPositions = [...displayedPositions];
    if (type === 'Value') {
      sortedPositions.sort((a, b) => a.value - b.value);
    } else if (type === 'Bank Name') {
      sortedPositions.sort((a, b) => a.name.localeCompare(b.name));
    } else if (type === 'Date') {
      sortedPositions.sort(
        (a, b) =>
        new Date(a.date.replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2')).getTime() -
        new Date(b.date.replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2')).getTime()
    );    } 
    setDisplayedPositions(sortedPositions);
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.titleRowLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>Transaction Activity</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.miniTitle}>Total Deposit</Text>
          <Text style={styles.value}>{formatCurrency(accountStats.totalDeposit)}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.miniTitle}>Total Withdrawn</Text>
          <Text style={styles.value}>{formatCurrency(accountStats.totalWithdrawn)}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.miniTitle}>Net Deposit</Text>
          <Text style={styles.value}>{formatCurrency(accountStats.netDeposit)}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.miniTitle}>Net Withdrawn</Text>
          <Text style={styles.value}>{formatCurrency(accountStats.netWithdrawn)}</Text>
        </View>
        <View style={styles.historyRow}>
          <Text style={styles.sectionTitle}>History</Text>
          <Dropdown 
            dropOptions={['Value', 'Date', 'Bank Name']}
            filler='Sort By'
            onSelect={handleSort}
          />
        </View>
        {displayedPositions.map((item, index) => (
          <FundingActivityItem
            key={index}
            icon={item.icon}
            name={item.name}
            value={item.value}
            page={item.page}
            date={item.date}
          />
        ))}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    flex: 1,
    backgroundColor: '#fff', // White background
    width: '100%'
  },
  details: {
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 22,
  },
  miniTitle: {
    fontFamily: 'urbanist',
    borderColor: '#616161',
    fontSize: 18,
  },
  value: {
    fontFamily: 'urbanist',
    borderColor: '#212121',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    fontSize: 30,
    color: '#000',
    fontFamily: 'urbanist',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Urbanist',
    },
  titleRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    margin: 20,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 20,
    marginTop: 30,
  },
});

export default FundingActivity;
