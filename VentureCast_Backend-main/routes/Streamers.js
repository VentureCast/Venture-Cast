// Fetch specific columns from Streamers table
async function getStreamers() {
  const { data: streamersData, error: streamersError } = await supabase
    .from('Streamers')
    .select('streamer_id, platform, username, channel_id, category, updated_at');

  if (streamersError) console.error('Error fetching streamers data:', streamersError);

  // Fetch all columns
  const { data: allStreamers, error: allStreamersError } = await supabase
    .from('Streamers')
    .select('*');

  if (allStreamersError) console.error('Error fetching all streamers data:', allStreamersError);

  // Fetch with filters
  const { data: filteredStreamers, error: filteredStreamersError } = await supabase
    .from('Streamers')
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

  if (filteredStreamersError) console.error('Error fetching filtered streamers data:', filteredStreamersError);

  // Insert new record
  const { data: insertStreamers, error: insertStreamersError } = await supabase
    .from('Streamers')
    .insert([{ some_column: 'someValue', other_column: 'otherValue' }])
    .select();

  if (insertStreamersError) console.error('Error inserting streamers data:', insertStreamersError);

  // Update record
  const { data: updateStreamers, error: updateStreamersError } = await supabase
    .from('Streamers')
    .update({ other_column: 'otherValue' })
    .eq('some_column', 'someValue')
    .select();

  if (updateStreamersError) console.error('Error updating streamers data:', updateStreamersError);

  // Delete record
  const { error: deleteStreamersError } = await supabase
    .from('Streamers')
    .delete()
    .eq('some_column', 'someValue');

  if (deleteStreamersError) console.error('Error deleting streamers data:', deleteStreamersError);

  // Real-time updates for Streamers table
  const streamersChannel = supabase
    .channel('custom-all-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'Streamers' },
      (payload) => console.log('Change received!', payload)
    )
    .subscribe();
}
