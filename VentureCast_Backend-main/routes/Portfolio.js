// Fetch specific columns from Portfolio table
const { data: portfolioData, error: portfolioError } = await supabase
  .from('Portfolio')
  .select('portfolio_id, user_id, streamer_id, created_at, shares_owned, average_cost');

if (portfolioError) console.error('Error fetching portfolio:', portfolioError);

// Fetch all columns
const { data: allData, error: allError } = await supabase
  .from('Portfolio')
  .select('*');

if (allError) console.error('Error fetching all portfolio data:', allError);

// Fetch with filters
const { data: filteredData, error: filterError } = await supabase
  .from('Portfolio')
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

if (filterError) console.error('Error fetching filtered data:', filterError);

// Insert new record
const { data: insertData, error: insertError } = await supabase
  .from('Portfolio')
  .insert([{ some_column: 'someValue', other_column: 'otherValue' }])
  .select();

if (insertError) console.error('Error inserting portfolio data:', insertError);

// Update record
const { data: updateData, error: updateError } = await supabase
  .from('Portfolio')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select();

if (updateError) console.error('Error updating portfolio data:', updateError);

// Delete record
const { error: deleteError } = await supabase
  .from('Portfolio')
  .delete()
  .eq('some_column', 'someValue');

if (deleteError) console.error('Error deleting portfolio data:', deleteError);

// Real-time updates for Portfolio table
const portfolioChannel = supabase
  .channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'Portfolio' },
    (payload) => console.log('Change received!', payload)
  )
  .subscribe();
