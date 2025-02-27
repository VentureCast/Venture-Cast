// Fetch specific columns from Users table
const { data: usersData, error: usersError } = await supabase
  .from('Users')
  .select('user_id, username, email, password_hash');

if (usersError) console.error('Error fetching users data:', usersError);

// Fetch all columns
const { data: allUsers, error: allUsersError } = await supabase
  .from('Users')
  .select('*');

if (allUsersError) console.error('Error fetching all users data:', allUsersError);

// Fetch with filters
const { data: filteredUsers, error: filteredUsersError } = await supabase
  .from('Users')
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

if (filteredUsersError) console.error('Error fetching filtered users data:', filteredUsersError);

// Insert new record
const { data: insertUser, error: insertUserError } = await supabase
  .from('Users')
  .insert([{ some_column: 'someValue', other_column: 'otherValue' }])
  .select();

if (insertUserError) console.error('Error inserting user data:', insertUserError);

// Update record
const { data: updateUser, error: updateUserError } = await supabase
  .from('Users')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select();

if (updateUserError) console.error('Error updating user data:', updateUserError);

// Delete record
const { error: deleteUserError } = await supabase
  .from('Users')
  .delete()
  .eq('some_column', 'someValue');

if (deleteUserError) console.error('Error deleting user data:', deleteUserError);

// Real-time updates for Users table
const usersChannel = supabase
  .channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'Users' },
    (payload) => console.log('Change received!', payload)
  )
  .subscribe();
