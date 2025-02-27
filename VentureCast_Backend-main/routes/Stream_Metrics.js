// Fetch specific columns from Stream Metrics table
const { data: streamMetricsData, error: streamMetricsError } = await supabase
  .from('Stream Metrics')
  .select('metric_id, platform, active_streamers, viewership_total, average_engagement');

if (streamMetricsError) console.error('Error fetching stream metrics data:', streamMetricsError);

// Fetch all columns
const { data: allStreamMetrics, error: allStreamMetricsError } = await supabase
  .from('Stream Metrics')
  .select('*');

if (allStreamMetricsError) console.error('Error fetching all stream metrics data:', allStreamMetricsError);

// Fetch with filters
const { data: filteredStreamMetrics, error: filteredStreamMetricsError } = await supabase
  .from('Stream Metrics')
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

if (filteredStreamMetricsError) console.error('Error fetching filtered stream metrics data:', filteredStreamMetricsError);

// Insert new record
const { data: insertStreamMetrics, error: insertStreamMetricsError } = await supabase
  .from('Stream Metrics')
  .insert([{ some_column: 'someValue', other_column: 'otherValue' }])
  .select();

if (insertStreamMetricsError) console.error('Error inserting stream metrics data:', insertStreamMetricsError);

// Update record
const { data: updateStreamMetrics, error: updateStreamMetricsError } = await supabase
  .from('Stream Metrics')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select();

if (updateStreamMetricsError) console.error('Error updating stream metrics data:', updateStreamMetricsError);

// Delete record
const { error: deleteStreamMetricsError } = await supabase
  .from('Stream Metrics')
  .delete()
