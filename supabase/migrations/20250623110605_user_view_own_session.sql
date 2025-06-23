-- Allow users to select their own payment sessions
create policy "Allow select for session owner"
on payment_sessions
for select
using (user_id = auth.uid());

