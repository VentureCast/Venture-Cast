// Fetch specific columns from Shares table
const { data: sharesData, error: sharesError } = await supabase
  .from('Shares')
  .select('share_id, Streamer_id, share_price, total_shares, market_cap, updated_at, created_at');

if (sharesError) console.error('Error fetching shares data:', sharesError);

// Fetch all columns
const { data: allShares, error: allSharesError } = await supabase
  .from('Shares')
  .select('*');

if (allSharesError) console.error('Error fetching all shares data:', allSharesError);

// Fetch with filters
const { data: filteredShares, error: filterSharesError } = await supabase
  .from('Shares')
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

if (filterSharesError) console.error('Error fetching filtered shares data:', filterSharesError);

// Insert new record
const { data: insertShares, error: insertSharesError } = await supabase
  .from('Shares')
  .insert([{ some_column: 'someValue', other_column: 'otherValue' }])
  .select();

if (insertSharesError) console.error('Error inserting shares data:', insertSharesError);

// Update record
const { data: updateShares, error: updateSharesError } = await supabase
  .from('Shares')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select();

if (updateSharesError) console.error('Error updating shares data:', updateSharesError);

// Delete record
const { error: deleteSharesError } = await supabase
  .from('Shares')
  .delete()
  .eq('some_column', 'someValue');

if (deleteSharesError) console.error('Error deleting shares data:', deleteSharesError);

// Real-time updates for Shares table
const sharesChannel = supabase
  .channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'Shares' },
    (payload) => console.log('Change received!', payload)
  )
  .subscribe();
