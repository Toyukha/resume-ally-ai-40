DROP FUNCTION IF EXISTS public.enqueue_email(TEXT, JSONB);
DROP FUNCTION IF EXISTS public.read_email_batch(TEXT, INT, INT);
DROP FUNCTION IF EXISTS public.delete_email(TEXT, BIGINT);
DROP FUNCTION IF EXISTS public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB);
DROP FUNCTION IF EXISTS public.email_queue_dispatch() CASCADE;
DROP FUNCTION IF EXISTS public.email_queue_wake() CASCADE;

DROP TABLE IF EXISTS public.email_send_log;
DROP TABLE IF EXISTS public.email_send_state;
DROP TABLE IF EXISTS public.suppressed_emails;
DROP TABLE IF EXISTS public.email_unsubscribe_tokens;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgmq') THEN
    BEGIN PERFORM pgmq.drop_queue('auth_emails'); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN PERFORM pgmq.drop_queue('auth_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN PERFORM pgmq.drop_queue('transactional_emails'); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN PERFORM pgmq.drop_queue('transactional_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;