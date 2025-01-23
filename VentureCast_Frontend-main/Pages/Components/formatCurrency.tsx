
const formatNumber = (number: number, decimals: number = 2): string => {
  return number.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};
const formatCurrency = (number: number, decimals: number = 2): string => {
  // Handle the sign manually to ensure proper placement of the dollar sign
  const sign = number < 0 ? '-' : '';
  return `${sign}$${formatNumber(Math.abs(number), decimals)}`;
};

export default formatCurrency;
