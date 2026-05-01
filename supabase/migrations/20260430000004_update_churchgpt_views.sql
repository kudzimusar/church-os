CREATE OR REPLACE VIEW public.v_churchgpt_platform_kpis AS
 SELECT ( SELECT count(*) AS count
           FROM churchgpt_users) AS total_registered_users,
    ( SELECT count(*) AS count
           FROM churchgpt_users
          WHERE churchgpt_users.subscription_status = 'active'::text) AS paid_users,
    ( SELECT count(*) AS count
           FROM churchgpt_users
          WHERE churchgpt_users.subscription_tier = 'starter'::text) AS free_users,
    ( SELECT count(*) AS count
           FROM churchgpt_guest_sessions) AS total_guest_sessions,
    ( SELECT count(*) AS count
           FROM churchgpt_guest_sessions
          WHERE churchgpt_guest_sessions.converted_user_id IS NOT NULL) AS converted_guests,
    ( SELECT count(*) AS count
           FROM churchgpt_conversations) AS total_conversations,
    ( SELECT count(*) AS count
           FROM ai_conversation_logs) AS total_messages,
    ( SELECT COALESCE(sum(ai_conversation_logs.tokens_used), 0::bigint) AS "coalesce"
           FROM ai_conversation_logs) AS total_tokens_used,
    ( SELECT count(*) AS count
           FROM churchgpt_session_analytics) AS total_sessions_tracked,
    ( SELECT COALESCE(avg(churchgpt_session_analytics.time_on_page_seconds), 0::numeric) AS "coalesce"
           FROM churchgpt_session_analytics
          WHERE churchgpt_session_analytics.time_on_page_seconds > 0) AS avg_session_duration_s,
    ( SELECT COALESCE(sum(
                CASE churchgpt_users.subscription_tier
                    WHEN 'lite'::text THEN 29
                    WHEN 'pro'::text THEN 79
                    WHEN 'enterprise'::text THEN 499
                    ELSE 0
                END), 0::bigint) AS "coalesce"
           FROM churchgpt_users
          WHERE churchgpt_users.subscription_status = 'active'::text) AS mrr_usd,
    ( SELECT json_object_agg(st.session_type, st.session_count) AS json_object_agg
           FROM ( SELECT churchgpt_interactions.session_type,
                    count(*) AS session_count
                   FROM churchgpt_interactions
                  GROUP BY churchgpt_interactions.session_type) st) AS session_type_breakdown;


CREATE OR REPLACE VIEW public.v_churchgpt_subscriber_intelligence AS
 SELECT cu.id,
    cu.user_id,
    cu.email,
    cu.display_name,
    cu.subscription_tier,
    cu.subscription_status,
    cu.quota_used,
    cu.quota_limit,
    cu.source,
    cu.created_at,
    cu.period_ends_at,
    cu.stripe_subscription_id,
    COALESCE(conv.conversation_count, 0::bigint) AS conversation_count,
    COALESCE(msg.message_count, 0::bigint) AS message_count,
    COALESCE(msg.tokens_total, 0::bigint) AS tokens_in_total,
    0::bigint AS tokens_out_total,
    COALESCE(msg.tokens_total, 0::bigint) AS tokens_total,
    COALESCE(sess.session_count, 0::bigint) AS session_count,
    COALESCE(sess.total_time_seconds, 0::bigint) AS total_time_seconds,
    sess.last_active_at,
        CASE cu.subscription_tier
            WHEN 'lite'::text THEN 29
            WHEN 'pro'::text THEN 79
            WHEN 'enterprise'::text THEN 499
            ELSE 0
        END AS mrr_value
   FROM churchgpt_users cu
     LEFT JOIN ( SELECT churchgpt_conversations.user_id,
            count(*) AS conversation_count
           FROM churchgpt_conversations
          GROUP BY churchgpt_conversations.user_id) conv ON conv.user_id = cu.user_id
     LEFT JOIN ( SELECT user_id,
            count(id) AS message_count,
            sum(tokens_used) AS tokens_total
           FROM ai_conversation_logs
          GROUP BY user_id) msg ON msg.user_id = cu.user_id
     LEFT JOIN ( SELECT churchgpt_session_analytics.user_id,
            count(*) AS session_count,
            sum(churchgpt_session_analytics.time_on_page_seconds) AS total_time_seconds,
            max(churchgpt_session_analytics.started_at) AS last_active_at
           FROM churchgpt_session_analytics
          GROUP BY churchgpt_session_analytics.user_id) sess ON sess.user_id = cu.user_id;

