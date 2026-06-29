-- Enable anonymous sign-ins for local development
INSERT INTO auth.instances (id, uuid, raw_base_config, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  '{"external":{"anonymous_users":{"enabled":true}}}',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET raw_base_config = '{"external":{"anonymous_users":{"enabled":true}}}',
    updated_at = NOW();
