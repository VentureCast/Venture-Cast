function formatDate(dateString) {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
  
    // Parse the input date string
    const [month, day, year] = dateString.split("/").map(Number);
  
    // Validate the input
    if (
      month < 1 || month > 12 || day < 1 || day > 31 || year < 1000 || year > 9999
    ) {
      return "Invalid date format";
    }
  
    // Convert to the desired format
    return `${months[month - 1]} ${day}, ${year}`;
  }
  export default formatDate;