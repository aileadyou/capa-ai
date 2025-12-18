CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: dataset_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.dataset_source AS ENUM (
    'url',
    'upload'
);


--
-- Name: processing_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.processing_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


--
-- Name: processing_step; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.processing_step AS ENUM (
    'data_collection',
    'standard_cleaning',
    'filtering',
    'selective_cleaning',
    'grouping_sorting',
    'export'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: dataset_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dataset_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dataset_id uuid NOT NULL,
    filename text NOT NULL,
    file_path text NOT NULL,
    file_size bigint,
    mime_type text,
    source_url text,
    status public.processing_status DEFAULT 'pending'::public.processing_status NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: datasets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.datasets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    source_type public.dataset_source NOT NULL,
    status public.processing_status DEFAULT 'pending'::public.processing_status NOT NULL,
    current_step public.processing_step DEFAULT 'data_collection'::public.processing_step,
    total_rows integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: processed_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.processed_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dataset_id uuid NOT NULL,
    job_id uuid,
    step public.processing_step NOT NULL,
    file_path text,
    row_count integer DEFAULT 0 NOT NULL,
    column_count integer,
    columns jsonb,
    sample_data jsonb,
    statistics jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: processing_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.processing_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dataset_id uuid NOT NULL,
    step public.processing_step NOT NULL,
    status public.processing_status DEFAULT 'pending'::public.processing_status NOT NULL,
    input_row_count integer,
    output_row_count integer,
    config jsonb,
    error_message text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    full_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    email_notifications boolean DEFAULT true,
    email_marketing boolean DEFAULT false,
    email_updates boolean DEFAULT true,
    sound_effects_enabled boolean DEFAULT true
);


--
-- Name: dataset_files dataset_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dataset_files
    ADD CONSTRAINT dataset_files_pkey PRIMARY KEY (id);


--
-- Name: datasets datasets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datasets
    ADD CONSTRAINT datasets_pkey PRIMARY KEY (id);


--
-- Name: processed_data processed_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processed_data
    ADD CONSTRAINT processed_data_pkey PRIMARY KEY (id);


--
-- Name: processing_jobs processing_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processing_jobs
    ADD CONSTRAINT processing_jobs_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: idx_dataset_files_dataset_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dataset_files_dataset_id ON public.dataset_files USING btree (dataset_id);


--
-- Name: idx_datasets_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_datasets_status ON public.datasets USING btree (status);


--
-- Name: idx_datasets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_datasets_user_id ON public.datasets USING btree (user_id);


--
-- Name: idx_processed_data_dataset_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processed_data_dataset_id ON public.processed_data USING btree (dataset_id);


--
-- Name: idx_processed_data_step; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processed_data_step ON public.processed_data USING btree (step);


--
-- Name: idx_processing_jobs_dataset_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processing_jobs_dataset_id ON public.processing_jobs USING btree (dataset_id);


--
-- Name: idx_processing_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processing_jobs_status ON public.processing_jobs USING btree (status);


--
-- Name: datasets update_datasets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_datasets_updated_at BEFORE UPDATE ON public.datasets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dataset_files dataset_files_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dataset_files
    ADD CONSTRAINT dataset_files_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.datasets(id) ON DELETE CASCADE;


--
-- Name: datasets datasets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datasets
    ADD CONSTRAINT datasets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: processed_data processed_data_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processed_data
    ADD CONSTRAINT processed_data_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.datasets(id) ON DELETE CASCADE;


--
-- Name: processed_data processed_data_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processed_data
    ADD CONSTRAINT processed_data_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.processing_jobs(id) ON DELETE CASCADE;


--
-- Name: processing_jobs processing_jobs_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processing_jobs
    ADD CONSTRAINT processing_jobs_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.datasets(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: dataset_files Users can create files for own datasets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create files for own datasets" ON public.dataset_files FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.datasets
  WHERE ((datasets.id = dataset_files.dataset_id) AND (datasets.user_id = auth.uid())))));


--
-- Name: processing_jobs Users can create jobs for own datasets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create jobs for own datasets" ON public.processing_jobs FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.datasets
  WHERE ((datasets.id = processing_jobs.dataset_id) AND (datasets.user_id = auth.uid())))));


--
-- Name: datasets Users can create own datasets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own datasets" ON public.datasets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: processed_data Users can create processed data for own datasets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create processed data for own datasets" ON public.processed_data FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.datasets
  WHERE ((datasets.id = processed_data.dataset_id) AND (datasets.user_id = auth.uid())))));


--
-- Name: datasets Users can delete own datasets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own datasets" ON public.datasets FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: dataset_files Users can update files for own datasets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update files for own datasets" ON public.dataset_files FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.datasets
  WHERE ((datasets.id = dataset_files.dataset_id) AND (datasets.user_id = auth.uid())))));


--
-- Name: processing_jobs Users can update jobs for own datasets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update jobs for own datasets" ON public.processing_jobs FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.datasets
  WHERE ((datasets.id = processing_jobs.dataset_id) AND (datasets.user_id = auth.uid())))));


--
-- Name: datasets Users can update own datasets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own datasets" ON public.datasets FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: dataset_files Users can view files for own datasets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view files for own datasets" ON public.dataset_files FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.datasets
  WHERE ((datasets.id = dataset_files.dataset_id) AND (datasets.user_id = auth.uid())))));


--
-- Name: processing_jobs Users can view jobs for own datasets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view jobs for own datasets" ON public.processing_jobs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.datasets
  WHERE ((datasets.id = processing_jobs.dataset_id) AND (datasets.user_id = auth.uid())))));


--
-- Name: datasets Users can view own datasets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own datasets" ON public.datasets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: processed_data Users can view processed data for own datasets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view processed data for own datasets" ON public.processed_data FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.datasets
  WHERE ((datasets.id = processed_data.dataset_id) AND (datasets.user_id = auth.uid())))));


--
-- Name: dataset_files; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dataset_files ENABLE ROW LEVEL SECURITY;

--
-- Name: datasets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

--
-- Name: processed_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.processed_data ENABLE ROW LEVEL SECURITY;

--
-- Name: processing_jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


