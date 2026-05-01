CREATE OR REPLACE FUNCTION public.check_churchgpt_quota(p_user_id uuid, p_org_id uuid, p_context text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_billing_month   date := date_trunc('month', now())::date;
  v_org_limit       integer;
  v_org_used        integer := 0;
  v_user_limit      integer := 50;  -- Starter default
  v_user_used       integer := 0;
  v_tier            text;
  v_remaining       integer;
BEGIN
  -- ---- GUEST (no user_id) ----
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'allowed',    true,   -- guest counter checked separately in gateway
      'remaining',  -1,     -- gateway uses guest_sessions table
      'tier',       'guest',
      'limit',      CASE p_context WHEN 'church' THEN 15 ELSE 7 END,
      'reason',     'guest_session'
    );
  END IF;

  -- ---- Get user's plan name and limit from churchgpt_users ----
  SELECT COALESCE(LOWER(subscription_tier), 'starter'), COALESCE(quota_limit, 50) 
  INTO v_tier, v_user_limit
  FROM churchgpt_users
  WHERE user_id = p_user_id;

  IF v_tier IS NULL THEN
    v_tier := 'starter';
  END IF;

  -- ---- Enterprise: always allowed ----
  IF v_tier = 'enterprise' THEN
    SELECT COALESCE(message_count, 0) INTO v_user_used
    FROM churchgpt_user_usage
    WHERE user_id = p_user_id AND billing_month = v_billing_month;

    RETURN jsonb_build_object(
      'allowed',    true,
      'remaining',  v_user_limit - v_user_used,
      'tier',       'enterprise',
      'limit',      v_user_limit,
      'used',       v_user_used,
      'reason',     'enterprise_unlimited'
    );
  END IF;

  -- ---- Platform context (pro+): check org quota ----
  IF p_context = 'platform' AND p_org_id IS NOT NULL THEN
    v_org_limit := get_org_quota_limit(p_org_id);

    SELECT COALESCE(message_count, 0) INTO v_org_used
    FROM churchgpt_org_usage
    WHERE org_id = p_org_id AND billing_month = v_billing_month;

    v_remaining := v_org_limit - v_org_used;

    RETURN jsonb_build_object(
      'allowed',    v_remaining > 0,
      'remaining',  GREATEST(v_remaining, 0),
      'tier',       v_tier,
      'limit',      v_org_limit,
      'used',       v_org_used,
      'reason',     CASE WHEN v_remaining <= 0 THEN 'org_quota_exceeded' ELSE 'ok' END
    );
  END IF;

  -- ---- Church context: check org quota + member multiplier ----
  IF p_context = 'church' AND p_org_id IS NOT NULL THEN
    v_org_limit := get_org_quota_limit(p_org_id) * 2;  -- 2x member multiplier

    SELECT COALESCE(message_count, 0) INTO v_org_used
    FROM churchgpt_org_usage
    WHERE org_id = p_org_id AND billing_month = v_billing_month;

    v_remaining := v_org_limit - v_org_used;

    RETURN jsonb_build_object(
      'allowed',    v_remaining > 0,
      'remaining',  GREATEST(v_remaining, 0),
      'tier',       v_tier,
      'limit',      v_org_limit,
      'used',       v_org_used,
      'reason',     CASE WHEN v_remaining <= 0 THEN 'org_quota_exceeded' ELSE 'ok' END,
      'multiplier', 2
    );
  END IF;

  -- ---- Public / Starter: check per-user monthly limit ----
  SELECT COALESCE(message_count, 0) INTO v_user_used
  FROM churchgpt_user_usage
  WHERE user_id = p_user_id AND billing_month = v_billing_month;

  v_remaining := v_user_limit - v_user_used;

  RETURN jsonb_build_object(
    'allowed',    v_remaining > 0,
    'remaining',  GREATEST(v_remaining, 0),
    'tier',       v_tier,
    'limit',      v_user_limit,
    'used',       v_user_used,
    'reason',     CASE WHEN v_remaining <= 0 THEN 'user_quota_exceeded' ELSE 'ok' END
  );
END;
$function$;
