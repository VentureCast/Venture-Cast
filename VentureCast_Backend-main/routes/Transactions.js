// Fetch specific columns from Transactions table
const { data: transactionsData, error: transactionsError } = await supabase
  .from('Transactions')
  .select('transaction_id, user_id, streamer_id, transaction_type, share_price, share_count, transaction_date');

if (transactionsError) console.error('Error fetching transactions data:', transactionsError);

// Fetch all columns
const { data: allTransactions, error: allTransactionsError } = await supabase
  .from('Transactions')
  .select('*');

if (allTransactionsError) console.error('Error fetching all transactions data:', allTransactionsError);

// Fetch with filters
const { data: filteredTransactions, error: filteredTransactionsError } = await supabase
  .from('Transactions')
  .select('*')
  .eq('column', 'Equal to')
  .gt('column', 'Greater than')
  .lt('column', 'Less than')
  .gte('column', 'Greater than or equal to')
  .lte('column', 'Less than or equal to')
  .like('column', '%CaseSensitive%')
  .ilike('column', '%CaseInsensitive%')
  .is('column', null)
  .in('column', ['Array', 'Values'])
  .neq('column', 'Not equal to')
  .contains('array_column', ['array', 'contains'])
  .containedBy('array_column', ['contained', 'by']);

if (filteredTransactionsError) console.error('Error fetching filtered transactions data:', filteredTransactionsError);

// Insert new record
const { data: insertTransaction, error: insertTransactionError } = await supabase
  .from('Transactions')
  .insert([{ some_column: 'someValue', other_column: 'otherValue' }])
  .select();

if (insertTransactionError) console.error('Error inserting transaction data:', insertTransactionError);

// Update record
const { data: updateTransaction, error: updateTransactionError } = await supabase
  .from('Transactions')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select();

if (updateTransactionError) console.error('Error updating transaction data:', updateTransactionError);

// Delete record
const { error: deleteTransactionError } = await supabase
  .from('Transactions')
  .delete()
  .eq('some_column', 'someValue');

if (deleteTransactionError) console.error('Error deleting transaction data:', deleteTransactionError);

// Real-time updates for Transactions table
const transactionsChannel = supabase
  .channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'Transactions' },
    (payload) => console.log('Change received!', payload)
  )
  .subscribe();
