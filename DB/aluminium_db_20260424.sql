--
-- PostgreSQL database dump
--

\restrict g4l1COF7aPKaOf6jguyc86fzyzHzCM3k43XPsHLkto4u1ootsOR6atFAZgffmc4

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-04-24 17:52:00 +07

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
-- TOC entry 5 (class 2615 OID 42464)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- TOC entry 4166 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 891 (class 1247 OID 42500)
-- Name: ApprovalStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ApprovalStatus" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public."ApprovalStatus" OWNER TO postgres;

--
-- TOC entry 888 (class 1247 OID 42494)
-- Name: ApprovalType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ApprovalType" AS ENUM (
    'tech_registration',
    'payment_slip'
);


ALTER TYPE public."ApprovalType" OWNER TO postgres;

--
-- TOC entry 903 (class 1247 OID 42530)
-- Name: ItemFormat; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ItemFormat" AS ENUM (
    'MTO',
    'PRESET',
    'MATERIAL'
);


ALTER TYPE public."ItemFormat" OWNER TO postgres;

--
-- TOC entry 924 (class 1247 OID 42596)
-- Name: NotificationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationStatus" AS ENUM (
    'unread',
    'read'
);


ALTER TYPE public."NotificationStatus" OWNER TO postgres;

--
-- TOC entry 921 (class 1247 OID 42588)
-- Name: NotificationTone; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationTone" AS ENUM (
    'green',
    'orange',
    'yellow'
);


ALTER TYPE public."NotificationTone" OWNER TO postgres;

--
-- TOC entry 918 (class 1247 OID 42572)
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'awaiting_payment',
    'verifying',
    'paid',
    'preparing',
    'shipped',
    'completed',
    'cancelled'
);


ALTER TYPE public."OrderStatus" OWNER TO postgres;

--
-- TOC entry 900 (class 1247 OID 42522)
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- TOC entry 909 (class 1247 OID 42544)
-- Name: PriceSource; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PriceSource" AS ENUM (
    'MANUAL',
    'FORMULA'
);


ALTER TYPE public."PriceSource" OWNER TO postgres;

--
-- TOC entry 906 (class 1247 OID 42538)
-- Name: ProductStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ProductStatus" AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE public."ProductStatus" OWNER TO postgres;

--
-- TOC entry 1014 (class 1247 OID 43197)
-- Name: ProjectItemStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ProjectItemStatus" AS ENUM (
    'DRAFT',
    'IN_CART',
    'QUOTED'
);


ALTER TYPE public."ProjectItemStatus" OWNER TO postgres;

--
-- TOC entry 912 (class 1247 OID 42550)
-- Name: ProjectStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ProjectStatus" AS ENUM (
    'draft',
    'quoted',
    'ordered',
    'paid',
    'done'
);


ALTER TYPE public."ProjectStatus" OWNER TO postgres;

--
-- TOC entry 915 (class 1247 OID 42562)
-- Name: QuoteStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."QuoteStatus" AS ENUM (
    'draft',
    'sent',
    'approved',
    'void'
);


ALTER TYPE public."QuoteStatus" OWNER TO postgres;

--
-- TOC entry 882 (class 1247 OID 42480)
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'admin',
    'tech',
    'user'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- TOC entry 1008 (class 1247 OID 43148)
-- Name: StockMovementType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StockMovementType" AS ENUM (
    'IN',
    'OUT',
    'ADJUSTMENT'
);


ALTER TYPE public."StockMovementType" OWNER TO postgres;

--
-- TOC entry 894 (class 1247 OID 42508)
-- Name: SubscriptionPlan; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SubscriptionPlan" AS ENUM (
    'monthly',
    'yearly'
);


ALTER TYPE public."SubscriptionPlan" OWNER TO postgres;

--
-- TOC entry 897 (class 1247 OID 42514)
-- Name: SubscriptionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SubscriptionStatus" AS ENUM (
    'pending',
    'active',
    'expired'
);


ALTER TYPE public."SubscriptionStatus" OWNER TO postgres;

--
-- TOC entry 885 (class 1247 OID 42488)
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserStatus" AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE public."UserStatus" OWNER TO postgres;

--
-- TOC entry 927 (class 1247 OID 42602)
-- Name: WarehouseStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."WarehouseStatus" AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE public."WarehouseStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 42634)
-- Name: AdminApproval; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AdminApproval" (
    id text NOT NULL,
    user_id text NOT NULL,
    type public."ApprovalType" NOT NULL,
    status public."ApprovalStatus" DEFAULT 'pending'::public."ApprovalStatus" NOT NULL,
    note text,
    approved_by text,
    approved_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AdminApproval" OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 43129)
-- Name: AluminiumItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AluminiumItem" (
    id text NOT NULL,
    code text,
    name text NOT NULL,
    image_path text,
    status public."ProductStatus" DEFAULT 'active'::public."ProductStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AluminiumItem" OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 42702)
-- Name: Brand; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Brand" (
    id text NOT NULL,
    code text,
    name text NOT NULL,
    status public."ProductStatus" DEFAULT 'active'::public."ProductStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Brand" OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 42715)
-- Name: Color; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Color" (
    id text NOT NULL,
    code text,
    name text NOT NULL,
    status public."ProductStatus" DEFAULT 'active'::public."ProductStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Color" OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 42926)
-- Name: EtaxRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EtaxRequest" (
    id text NOT NULL,
    order_id text NOT NULL,
    legal_name text NOT NULL,
    tax_id text NOT NULL,
    house_no text,
    moo text,
    road text,
    province text,
    district text,
    subdistrict text,
    postal_code text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EtaxRequest" OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 42803)
-- Name: Formula; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Formula" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    standard_width integer NOT NULL,
    standard_height integer NOT NULL,
    standard_length integer NOT NULL,
    glass_type_id text,
    glass_thickness_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    product_type_id text,
    production_quantity integer,
    sequence_number integer,
    unit_id text,
    description text,
    glass_height_offset integer DEFAULT 100,
    glass_width_offset integer DEFAULT 100,
    model_path text,
    product_price numeric(65,30),
    total_price numeric(65,30),
    product_id text
);


ALTER TABLE public."Formula" OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 42818)
-- Name: FormulaItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FormulaItem" (
    id text NOT NULL,
    formula_id text NOT NULL,
    "position" text,
    length_mm integer NOT NULL,
    qty integer NOT NULL,
    total_length_mm integer,
    angle text,
    product_id text CONSTRAINT "FormulaItem_aluminium_item_id_not_null" NOT NULL
);


ALTER TABLE public."FormulaItem" OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 42741)
-- Name: GlassThickness; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GlassThickness" (
    id text NOT NULL,
    code text,
    thickness_mm integer NOT NULL,
    status public."ProductStatus" DEFAULT 'active'::public."ProductStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."GlassThickness" OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 42728)
-- Name: GlassType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GlassType" (
    id text NOT NULL,
    code text,
    name text NOT NULL,
    status public."ProductStatus" DEFAULT 'active'::public."ProductStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    height_mm double precision,
    width_mm double precision
);


ALTER TABLE public."GlassType" OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 42768)
-- Name: Inventory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Inventory" (
    id text NOT NULL,
    warehouse_id text NOT NULL,
    product_id text NOT NULL,
    qty_on_hand integer DEFAULT 0 NOT NULL,
    low_stock_threshold integer DEFAULT 5 NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Inventory" OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 42939)
-- Name: Notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    user_id text NOT NULL,
    message text NOT NULL,
    tone public."NotificationTone" NOT NULL,
    status public."NotificationStatus" DEFAULT 'unread'::public."NotificationStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    read_at timestamp(3) without time zone
);


ALTER TABLE public."Notification" OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 42885)
-- Name: Order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    code text NOT NULL,
    project_id text,
    status public."OrderStatus" DEFAULT 'awaiting_payment'::public."OrderStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    customer_user_id text,
    ship_house_no text,
    ship_moo text,
    ship_building text,
    ship_soi text,
    ship_road text,
    ship_province text,
    ship_district text,
    ship_subdistrict text,
    ship_postal_code text
);


ALTER TABLE public."Order" OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 42899)
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    order_id text NOT NULL,
    product_id text NOT NULL,
    qty integer NOT NULL,
    unit_price numeric(65,30) NOT NULL,
    total_price numeric(65,30) NOT NULL,
    brand_id text,
    color_id text,
    height integer,
    thickness double precision,
    width integer
);


ALTER TABLE public."OrderItem" OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 42912)
-- Name: Payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    order_id text NOT NULL,
    slip_url text NOT NULL,
    status public."PaymentStatus" DEFAULT 'pending'::public."PaymentStatus" NOT NULL,
    approved_by text,
    approved_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Payment" OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 42783)
-- Name: Product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    sku text NOT NULL,
    name text NOT NULL,
    item_format public."ItemFormat" NOT NULL,
    product_type_id text NOT NULL,
    unit_id text NOT NULL,
    brand_id text,
    warehouse_id text,
    price_manual numeric(65,30),
    price_source public."PriceSource" DEFAULT 'MANUAL'::public."PriceSource" NOT NULL,
    formula_id text,
    status public."ProductStatus" DEFAULT 'active'::public."ProductStatus" NOT NULL,
    description text,
    image_url text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Product" OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 42676)
-- Name: ProductType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductType" (
    id text NOT NULL,
    code text,
    name text NOT NULL,
    status public."ProductStatus" DEFAULT 'active'::public."ProductStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ProductType" OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 42830)
-- Name: Project; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Project" (
    id text NOT NULL,
    code text,
    name text NOT NULL,
    customer_name text NOT NULL,
    phone text NOT NULL,
    tax_id text,
    house_no text,
    moo text,
    road text,
    province text,
    district text,
    subdistrict text,
    postal_code text,
    status public."ProjectStatus" DEFAULT 'draft'::public."ProjectStatus" NOT NULL,
    created_by_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    building text,
    soi text
);


ALTER TABLE public."Project" OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 42847)
-- Name: ProjectItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProjectItem" (
    id text NOT NULL,
    project_id text NOT NULL,
    formula_id text,
    width integer,
    height integer,
    quantity integer,
    unit text,
    brand_id text,
    glass_type_id text,
    glass_thickness_id text,
    color_id text,
    glass_height integer,
    glass_quantity integer,
    glass_thickness_mm double precision,
    glass_width integer,
    length integer,
    panel_count integer,
    product_id text,
    status public."ProjectItemStatus" DEFAULT 'DRAFT'::public."ProjectItemStatus" NOT NULL,
    price numeric(65,30)
);


ALTER TABLE public."ProjectItem" OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 42856)
-- Name: Quotation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Quotation" (
    id text NOT NULL,
    project_id text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    status public."QuoteStatus" DEFAULT 'draft'::public."QuoteStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    credit_days integer DEFAULT 0 NOT NULL,
    description text,
    discount numeric(65,30) DEFAULT 0 NOT NULL,
    due_date timestamp(3) without time zone,
    employee_name text,
    internal_notes text,
    notes text,
    quotation_date timestamp(3) without time zone,
    reference_no text,
    vat_enabled boolean DEFAULT false NOT NULL,
    withholding_tax_percent numeric(65,30) DEFAULT 0 NOT NULL
);


ALTER TABLE public."Quotation" OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 42872)
-- Name: QuotationItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."QuotationItem" (
    id text NOT NULL,
    quotation_id text NOT NULL,
    description text NOT NULL,
    qty integer NOT NULL,
    unit text,
    unit_price numeric(65,30) NOT NULL,
    total numeric(65,30) NOT NULL
);


ALTER TABLE public."QuotationItem" OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 42648)
-- Name: Subscription; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Subscription" (
    id text NOT NULL,
    user_id text NOT NULL,
    plan public."SubscriptionPlan" NOT NULL,
    status public."SubscriptionStatus" DEFAULT 'pending'::public."SubscriptionStatus" NOT NULL,
    start_at timestamp(3) without time zone,
    end_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Subscription" OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 42662)
-- Name: SubscriptionPayment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SubscriptionPayment" (
    id text NOT NULL,
    subscription_id text NOT NULL,
    slip_url text NOT NULL,
    status public."PaymentStatus" DEFAULT 'pending'::public."PaymentStatus" NOT NULL,
    approved_by text,
    approved_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SubscriptionPayment" OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 42689)
-- Name: Unit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Unit" (
    id text NOT NULL,
    code text,
    name text NOT NULL,
    status public."ProductStatus" DEFAULT 'active'::public."ProductStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Unit" OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 42607)
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    role public."Role" NOT NULL,
    email text NOT NULL,
    phone text,
    password_hash text NOT NULL,
    status public."UserStatus" DEFAULT 'active'::public."UserStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 42623)
-- Name: UserProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserProfile" (
    id text NOT NULL,
    user_id text NOT NULL,
    prefix text,
    first_name text NOT NULL,
    last_name text NOT NULL,
    house_no text,
    moo text,
    road text,
    province text,
    district text,
    subdistrict text,
    postal_code text
);


ALTER TABLE public."UserProfile" OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 42754)
-- Name: Warehouse; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Warehouse" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    status public."WarehouseStatus" DEFAULT 'active'::public."WarehouseStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Warehouse" OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 42465)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 43155)
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_movements (
    id text NOT NULL,
    warehouse_id text NOT NULL,
    product_id text NOT NULL,
    type public."StockMovementType" NOT NULL,
    quantity integer NOT NULL,
    reference text,
    note text,
    created_by text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.stock_movements OWNER TO postgres;

--
-- TOC entry 4136 (class 0 OID 42634)
-- Dependencies: 222
-- Data for Name: AdminApproval; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AdminApproval" (id, user_id, type, status, note, approved_by, approved_at, created_at) FROM stdin;
356518fc-0632-4259-9ee7-b4046035eedf	1a6cfd48-6b74-4ed1-bd5d-7a9f758903a3	tech_registration	approved	\N	c1a778c8-2e5f-4739-8126-647c85b73d81	2026-04-20 09:44:35.887	2026-04-20 09:44:36.261
\.


--
-- TOC entry 4159 (class 0 OID 43129)
-- Dependencies: 245
-- Data for Name: AluminiumItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AluminiumItem" (id, code, name, image_path, status, created_at) FROM stdin;
\.


--
-- TOC entry 4141 (class 0 OID 42702)
-- Dependencies: 227
-- Data for Name: Brand; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Brand" (id, code, name, status, created_at) FROM stdin;
14d2e861-e591-49ae-98f2-5f5fa62f59d2	MCK	MCK Thailand	active	2026-04-20 09:44:36.27
22f57209-24d6-4013-bcd9-4c8f060f2ee1	MMA	MMA	active	2026-04-23 00:58:53.733
\.


--
-- TOC entry 4142 (class 0 OID 42715)
-- Dependencies: 228
-- Data for Name: Color; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Color" (id, code, name, status, created_at) FROM stdin;
6ac5d7c3-6884-4fd1-8f26-2acde67f76c5	000000	ดำ	active	2026-04-20 09:44:36.275
\.


--
-- TOC entry 4157 (class 0 OID 42926)
-- Dependencies: 243
-- Data for Name: EtaxRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EtaxRequest" (id, order_id, legal_name, tax_id, house_no, moo, road, province, district, subdistrict, postal_code, created_at) FROM stdin;
671929e9-6e7f-4e00-87b5-5b81afc05400	d5b70fe0-3558-4a0b-a527-58775a060082	MT001 test Fumula	111111	1	2	3	กรุงเทพมหานคร	เขตพระนคร	พระบรมมหาราชวัง	10200	2026-04-24 08:49:26.627
\.


--
-- TOC entry 4148 (class 0 OID 42803)
-- Dependencies: 234
-- Data for Name: Formula; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Formula" (id, code, name, standard_width, standard_height, standard_length, glass_type_id, glass_thickness_id, created_at, product_type_id, production_quantity, sequence_number, unit_id, description, glass_height_offset, glass_width_offset, model_path, product_price, total_price, product_id) FROM stdin;
ec0c7520-bae5-4086-8171-21376aa99dfb	MT001 Fumula	MT001 Fumula	100	100	100	ac390415-c88f-42fa-95ef-3419eea71ecf	\N	2026-04-20 10:46:01.973	4c264875-c328-42d5-ab5d-7d3dc48a729f	100	1	45146a4a-8556-4e2c-aa37-faddf258f858	\N	100	100	\N	1000.000000000000000000000000000000	200.000000000000000000000000000000	8843d6a9-e39c-4032-97f4-1f8e376314bc
9c29277a-dba7-4f99-9c5f-9085f42494a2	MT001-2	MT001-2	500	500	500	ac390415-c88f-42fa-95ef-3419eea71ecf	\N	2026-04-20 09:49:11.384	4c264875-c328-42d5-ab5d-7d3dc48a729f	100	2	45146a4a-8556-4e2c-aa37-faddf258f858	\N	100	100	\N	1000.000000000000000000000000000000	200.000000000000000000000000000000	8843d6a9-e39c-4032-97f4-1f8e376314bc
b246cb8d-f237-4023-9e88-728b201d67c2	MT002 formula	สูตรประตู 1	100	100	100	ac390415-c88f-42fa-95ef-3419eea71ecf	c3552912-c042-4c6d-b974-08da084b8fd1	2026-04-20 09:44:36.285	4c264875-c328-42d5-ab5d-7d3dc48a729f	100	\N	45146a4a-8556-4e2c-aa37-faddf258f858	\N	100	100	\N	1200.000000000000000000000000000000	500.000000000000000000000000000000	996e79a5-0ed7-4220-9eb4-fe27a0c21561
3337e19f-cada-4cdc-8afc-65f56b36b486	MT003 Formula	MT003 Formula	100	100	100	ac390415-c88f-42fa-95ef-3419eea71ecf	\N	2026-04-24 07:40:51.23	4c264875-c328-42d5-ab5d-7d3dc48a729f	100	4	45146a4a-8556-4e2c-aa37-faddf258f858	\N	100	100	\N	100.000000000000000000000000000000	100.000000000000000000000000000000	b44fd90b-61db-434b-ab08-3fb7a8e1b30f
\.


--
-- TOC entry 4149 (class 0 OID 42818)
-- Dependencies: 235
-- Data for Name: FormulaItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FormulaItem" (id, formula_id, "position", length_mm, qty, total_length_mm, angle, product_id) FROM stdin;
b36eb1e9-4a89-441e-b56c-37685ef4c03e	ec0c7520-bae5-4086-8171-21376aa99dfb	horizontal	100	2	100	99	63d58d17-b356-4280-b5fa-f80e8be91b23
4fd52888-7b3f-44df-b2a4-e1b42ed7fb63	9c29277a-dba7-4f99-9c5f-9085f42494a2	vertical	100	2	100	90	63d58d17-b356-4280-b5fa-f80e8be91b23
768cca5e-a58b-41a1-8003-8c7d62d25c34	b246cb8d-f237-4023-9e88-728b201d67c2	horizontal	100	5	100	90	61d5f417-d320-480a-aaa1-a08511ec4f75
06e829c2-d5ae-4622-a409-f6ac6695d766	3337e19f-cada-4cdc-8afc-65f56b36b486	horizontal	100	1	100	90	63d58d17-b356-4280-b5fa-f80e8be91b23
\.


--
-- TOC entry 4144 (class 0 OID 42741)
-- Dependencies: 230
-- Data for Name: GlassThickness; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GlassThickness" (id, code, thickness_mm, status, created_at) FROM stdin;
c3552912-c042-4c6d-b974-08da084b8fd1	TH-6	6	active	2026-04-20 09:44:36.278
\.


--
-- TOC entry 4143 (class 0 OID 42728)
-- Dependencies: 229
-- Data for Name: GlassType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GlassType" (id, code, name, status, created_at, height_mm, width_mm) FROM stdin;
ac390415-c88f-42fa-95ef-3419eea71ecf	GL-CL	กระจกใส	active	2026-04-20 09:44:36.277	100	100
\.


--
-- TOC entry 4146 (class 0 OID 42768)
-- Dependencies: 232
-- Data for Name: Inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Inventory" (id, warehouse_id, product_id, qty_on_hand, low_stock_threshold, updated_at) FROM stdin;
b583bff4-bbcf-4d62-a560-c7e0fc452291	c179a56a-df5d-411b-bea4-c148b72842be	30ef51d4-2fcf-449d-a08b-4597fc2ab8a0	80	10	2026-04-23 12:03:37.569
\.


--
-- TOC entry 4158 (class 0 OID 42939)
-- Dependencies: 244
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notification" (id, user_id, message, tone, status, created_at, read_at) FROM stdin;
57024cd7-cf10-48f4-822d-17d869e62137	1a6cfd48-6b74-4ed1-bd5d-7a9f758903a3	บัญชีของคุณได้รับการอนุมัติแล้ว	green	unread	2026-04-20 09:44:36.288	\N
\.


--
-- TOC entry 4154 (class 0 OID 42885)
-- Dependencies: 240
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Order" (id, code, project_id, status, created_at, updated_at, customer_user_id, ship_house_no, ship_moo, ship_building, ship_soi, ship_road, ship_province, ship_district, ship_subdistrict, ship_postal_code) FROM stdin;
56cf8914-299c-4c8d-8dcb-aa9625612637	OD1776683304191	6a47ba8a-722a-47ef-9fa4-3118a87cd192	paid	2026-04-20 11:08:24.193	2026-04-23 12:19:21.463	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d5b70fe0-3558-4a0b-a527-58775a060082	OD1777020566626	6a47ba8a-722a-47ef-9fa4-3118a87cd192	paid	2026-04-24 08:49:26.627	2026-04-24 09:03:08.228	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4aa5cb0a-4112-43fb-94bd-d4eae7b23f7d	OD1777025855205	\N	paid	2026-04-24 10:17:35.207	2026-04-24 10:29:36.526	eeb9fb08-5edf-4d42-b456-6a467ac54924	1	5	5	5	5	กรุงเทพมหานคร	เขตดุสิต	ดุสิต	10300
\.


--
-- TOC entry 4155 (class 0 OID 42899)
-- Dependencies: 241
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderItem" (id, order_id, product_id, qty, unit_price, total_price, brand_id, color_id, height, thickness, width) FROM stdin;
af14943a-37a8-4248-99fc-971358986671	56cf8914-299c-4c8d-8dcb-aa9625612637	8843d6a9-e39c-4032-97f4-1f8e376314bc	2	1100.000000000000000000000000000000	2200.000000000000000000000000000000	14d2e861-e591-49ae-98f2-5f5fa62f59d2	6ac5d7c3-6884-4fd1-8f26-2acde67f76c5	100	\N	100
61516b2b-10fd-447c-9266-329789089630	d5b70fe0-3558-4a0b-a527-58775a060082	b44fd90b-61db-434b-ab08-3fb7a8e1b30f	3	100.000000000000000000000000000000	300.000000000000000000000000000000	14d2e861-e591-49ae-98f2-5f5fa62f59d2	6ac5d7c3-6884-4fd1-8f26-2acde67f76c5	300	\N	300
20873aac-c536-44d5-bc82-a7d0cebd45d0	4aa5cb0a-4112-43fb-94bd-d4eae7b23f7d	b44fd90b-61db-434b-ab08-3fb7a8e1b30f	1	100.000000000000000000000000000000	100.000000000000000000000000000000	\N	\N	\N	\N	\N
d18bb91d-e926-4b5f-a883-5654f4a6da72	4aa5cb0a-4112-43fb-94bd-d4eae7b23f7d	61d5f417-d320-480a-aaa1-a08511ec4f75	2	100.000000000000000000000000000000	200.000000000000000000000000000000	\N	\N	\N	\N	\N
\.


--
-- TOC entry 4156 (class 0 OID 42912)
-- Dependencies: 242
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payment" (id, order_id, slip_url, status, approved_by, approved_at, created_at) FROM stdin;
ff5089d3-5b66-4e72-a123-d2635f7ddf42	56cf8914-299c-4c8d-8dcb-aa9625612637	/uploads/payment-slip-1776683304291.png	approved	c1a778c8-2e5f-4739-8126-647c85b73d81	2026-04-23 12:19:21.459	2026-04-20 11:08:24.3
eb010adc-7f7f-4720-8790-f17d62975f61	d5b70fe0-3558-4a0b-a527-58775a060082	/uploads/payment-slip-1777020566670.png	approved	c1a778c8-2e5f-4739-8126-647c85b73d81	2026-04-24 09:03:08.226	2026-04-24 08:49:26.695
49a2f3ef-afe1-4ede-a3e4-de73e97359f1	4aa5cb0a-4112-43fb-94bd-d4eae7b23f7d	/uploads/payment-slip-1777025855278.svg	approved	c1a778c8-2e5f-4739-8126-647c85b73d81	2026-04-24 10:29:36.523	2026-04-24 10:17:35.284
\.


--
-- TOC entry 4147 (class 0 OID 42783)
-- Dependencies: 233
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, sku, name, item_format, product_type_id, unit_id, brand_id, warehouse_id, price_manual, price_source, formula_id, status, description, image_url, created_at, updated_at) FROM stdin;
63d58d17-b356-4280-b5fa-f80e8be91b23	ALU-001	อลูมิเนียมโปรไฟล์	MATERIAL	8d2eb894-100f-41b0-8ba9-fa7d7c37ecc6	45146a4a-8556-4e2c-aa37-faddf258f858	14d2e861-e591-49ae-98f2-5f5fa62f59d2	c179a56a-df5d-411b-bea4-c148b72842be	100.000000000000000000000000000000	MANUAL	\N	active	\N	\N	2026-04-20 09:44:36.279	2026-04-20 09:44:36.279
b44fd90b-61db-434b-ab08-3fb7a8e1b30f	TESTM003	TESTM003	MTO	4c264875-c328-42d5-ab5d-7d3dc48a729f	45146a4a-8556-4e2c-aa37-faddf258f858	14d2e861-e591-49ae-98f2-5f5fa62f59d2	c179a56a-df5d-411b-bea4-c148b72842be	100.000000000000000000000000000000	FORMULA	3337e19f-cada-4cdc-8afc-65f56b36b486	active	\N	\N	2026-04-24 07:39:55.459	2026-04-24 07:43:25.924
1aeb9fa1-fe4d-4cf5-a235-143388c9e260	Window100	WD001	PRESET	4c264875-c328-42d5-ab5d-7d3dc48a729f	45146a4a-8556-4e2c-aa37-faddf258f858	14d2e861-e591-49ae-98f2-5f5fa62f59d2	c179a56a-df5d-411b-bea4-c148b72842be	1000.000000000000000000000000000000	MANUAL	\N	active	\N	/uploads/products/1aeb9fa1-fe4d-4cf5-a235-143388c9e260-1777027635255.webp	2026-04-24 10:47:15.233	2026-04-24 10:47:15.261
a01c99ab-9e90-4c34-b043-6246bcff6de2	DO001	ประตู  200	PRESET	8d2eb894-100f-41b0-8ba9-fa7d7c37ecc6	45146a4a-8556-4e2c-aa37-faddf258f858	14d2e861-e591-49ae-98f2-5f5fa62f59d2	c179a56a-df5d-411b-bea4-c148b72842be	1500.000000000000000000000000000000	MANUAL	\N	active	\N	/uploads/products/a01c99ab-9e90-4c34-b043-6246bcff6de2-1777027677436.svg	2026-04-24 10:47:57.425	2026-04-24 10:47:57.438
61d5f417-d320-480a-aaa1-a08511ec4f75	ALU002	ALU002	MATERIAL	4c264875-c328-42d5-ab5d-7d3dc48a729f	45146a4a-8556-4e2c-aa37-faddf258f858	22f57209-24d6-4013-bcd9-4c8f060f2ee1	c179a56a-df5d-411b-bea4-c148b72842be	100.000000000000000000000000000000	MANUAL	\N	active		/uploads/products/61d5f417-d320-480a-aaa1-a08511ec4f75-1776678406147.svg	2026-04-20 09:46:46.129	2026-04-23 00:59:05.13
30ef51d4-2fcf-449d-a08b-4597fc2ab8a0	WIN-001	หน้าต่างบานเลื่อน	MTO	8d2eb894-100f-41b0-8ba9-fa7d7c37ecc6	45146a4a-8556-4e2c-aa37-faddf258f858	14d2e861-e591-49ae-98f2-5f5fa62f59d2	c179a56a-df5d-411b-bea4-c148b72842be	1500.000000000000000000000000000000	MANUAL	\N	active	หน้าต่างสำเร็จรูป	\N	2026-04-20 09:44:36.283	2026-04-23 01:16:08.092
8843d6a9-e39c-4032-97f4-1f8e376314bc	MT001-1	MT001-1	MTO	4c264875-c328-42d5-ab5d-7d3dc48a729f	45146a4a-8556-4e2c-aa37-faddf258f858	22f57209-24d6-4013-bcd9-4c8f060f2ee1	c179a56a-df5d-411b-bea4-c148b72842be	200.000000000000000000000000000000	FORMULA	ec0c7520-bae5-4086-8171-21376aa99dfb	active		/uploads/products/8843d6a9-e39c-4032-97f4-1f8e376314bc-1776905979212.svg	2026-04-20 09:44:36.287	2026-04-23 14:51:15.579
996e79a5-0ed7-4220-9eb4-fe27a0c21561	MT002-1	MT002-1	MTO	4c264875-c328-42d5-ab5d-7d3dc48a729f	45146a4a-8556-4e2c-aa37-faddf258f858	14d2e861-e591-49ae-98f2-5f5fa62f59d2	c179a56a-df5d-411b-bea4-c148b72842be	500.000000000000000000000000000000	FORMULA	9c29277a-dba7-4f99-9c5f-9085f42494a2	active		\N	2026-04-20 09:46:06.763	2026-04-23 14:51:49.831
\.


--
-- TOC entry 4139 (class 0 OID 42676)
-- Dependencies: 225
-- Data for Name: ProductType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductType" (id, code, name, status, created_at) FROM stdin;
8d2eb894-100f-41b0-8ba9-fa7d7c37ecc6	DR	ประตู	active	2026-04-20 09:44:36.267
4c264875-c328-42d5-ab5d-7d3dc48a729f	WR	หน้างต่าง	active	2026-04-20 09:47:04.506
\.


--
-- TOC entry 4150 (class 0 OID 42830)
-- Dependencies: 236
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Project" (id, code, name, customer_name, phone, tax_id, house_no, moo, road, province, district, subdistrict, postal_code, status, created_by_id, created_at, updated_at, building, soi) FROM stdin;
2a2bd27b-f659-4f1a-ab13-58955e18d8fc	\N	ตะกร้าสินค้า	user@demo.com	0000000000	\N	\N	\N	\N	\N	\N	\N	\N	draft	eeb9fb08-5edf-4d42-b456-6a467ac54924	2026-04-24 09:18:07.524	2026-04-24 09:18:07.524	\N	\N
6a47ba8a-722a-47ef-9fa4-3118a87cd192	MT001_F	MT001 test Fumula	MT001 test Fumula	09433333	111111	1	2	3	สมุทรปราการ	เมืองสมุทรปราการ	สำโรงเหนือ	10270	quoted	1a6cfd48-6b74-4ed1-bd5d-7a9f758903a3	2026-04-20 09:50:25.055	2026-04-24 10:29:58.311	3	3
\.


--
-- TOC entry 4151 (class 0 OID 42847)
-- Dependencies: 237
-- Data for Name: ProjectItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProjectItem" (id, project_id, formula_id, width, height, quantity, unit, brand_id, glass_type_id, glass_thickness_id, color_id, glass_height, glass_quantity, glass_thickness_mm, glass_width, length, panel_count, product_id, status, price) FROM stdin;
5de052c4-bfc2-4b71-9a5c-0c1daed1ca96	6a47ba8a-722a-47ef-9fa4-3118a87cd192	3337e19f-cada-4cdc-8afc-65f56b36b486	300	300	3	\N	14d2e861-e591-49ae-98f2-5f5fa62f59d2	ac390415-c88f-42fa-95ef-3419eea71ecf	\N	6ac5d7c3-6884-4fd1-8f26-2acde67f76c5	100	1	1	100	300	1	b44fd90b-61db-434b-ab08-3fb7a8e1b30f	IN_CART	100.000000000000000000000000000000
af8d6005-bc1d-43cc-b0eb-176111df8692	2a2bd27b-f659-4f1a-ab13-58955e18d8fc	3337e19f-cada-4cdc-8afc-65f56b36b486	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	b44fd90b-61db-434b-ab08-3fb7a8e1b30f	IN_CART	\N
a965d2ea-8f04-416d-81c6-65b6e7abdfbc	2a2bd27b-f659-4f1a-ab13-58955e18d8fc	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	61d5f417-d320-480a-aaa1-a08511ec4f75	IN_CART	\N
844d8a07-72cd-485d-98fc-3baafd0b8cb9	2a2bd27b-f659-4f1a-ab13-58955e18d8fc	\N	\N	\N	2	\N	14d2e861-e591-49ae-98f2-5f5fa62f59d2	\N	\N	6ac5d7c3-6884-4fd1-8f26-2acde67f76c5	\N	\N	\N	\N	\N	\N	1aeb9fa1-fe4d-4cf5-a235-143388c9e260	IN_CART	\N
\.


--
-- TOC entry 4152 (class 0 OID 42856)
-- Dependencies: 238
-- Data for Name: Quotation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Quotation" (id, project_id, version, status, created_at, updated_at, credit_days, description, discount, due_date, employee_name, internal_notes, notes, quotation_date, reference_no, vat_enabled, withholding_tax_percent) FROM stdin;
681f03c1-890b-46c9-9dc0-91e76623bcf3	6a47ba8a-722a-47ef-9fa4-3118a87cd192	1	draft	2026-04-24 10:29:58.3	2026-04-24 10:29:58.3	0	\N	0.000000000000000000000000000000	\N	\N	\N	\N	\N	\N	f	0.000000000000000000000000000000
\.


--
-- TOC entry 4153 (class 0 OID 42872)
-- Dependencies: 239
-- Data for Name: QuotationItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."QuotationItem" (id, quotation_id, description, qty, unit, unit_price, total) FROM stdin;
8d1413e8-a590-4bfb-83da-5ffc5c0ca9d7	681f03c1-890b-46c9-9dc0-91e76623bcf3	TESTM003 (300x300 มม.)	3	ชุด	100.000000000000000000000000000000	300.000000000000000000000000000000
\.


--
-- TOC entry 4137 (class 0 OID 42648)
-- Dependencies: 223
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Subscription" (id, user_id, plan, status, start_at, end_at, created_at) FROM stdin;
b4be9b04-c3d9-4a2b-a989-4892ece8fe15	1a6cfd48-6b74-4ed1-bd5d-7a9f758903a3	monthly	active	2026-04-20 09:44:35.887	2026-05-20 09:44:35.887	2026-04-20 09:44:36.263
\.


--
-- TOC entry 4138 (class 0 OID 42662)
-- Dependencies: 224
-- Data for Name: SubscriptionPayment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SubscriptionPayment" (id, subscription_id, slip_url, status, approved_by, approved_at, created_at) FROM stdin;
60b482e0-431c-4b81-8375-00fcf2bf9d1c	b4be9b04-c3d9-4a2b-a989-4892ece8fe15	/uploads/demo-slip.png	approved	c1a778c8-2e5f-4739-8126-647c85b73d81	2026-04-20 09:44:35.887	2026-04-20 09:44:36.265
\.


--
-- TOC entry 4140 (class 0 OID 42689)
-- Dependencies: 226
-- Data for Name: Unit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Unit" (id, code, name, status, created_at) FROM stdin;
45146a4a-8556-4e2c-aa37-faddf258f858	PCS	ชิ้น	active	2026-04-20 09:44:36.268
\.


--
-- TOC entry 4134 (class 0 OID 42607)
-- Dependencies: 220
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, role, email, phone, password_hash, status, created_at, updated_at) FROM stdin;
c1a778c8-2e5f-4739-8126-647c85b73d81	admin	admin@demo.com	\N	$2b$10$HtHpogMZMpUL2MqiNuKSCO5vg3WSiyJ8FcxDpBk4xMcrSB8RVHpj.	active	2026-04-20 09:44:36.248	2026-04-20 09:44:36.248
eeb9fb08-5edf-4d42-b456-6a467ac54924	user	user@demo.com	\N	$2b$10$HtHpogMZMpUL2MqiNuKSCO5vg3WSiyJ8FcxDpBk4xMcrSB8RVHpj.	active	2026-04-20 09:44:36.257	2026-04-20 09:44:36.257
1a6cfd48-6b74-4ed1-bd5d-7a9f758903a3	tech	tech@demo.com	\N	$2b$10$HtHpogMZMpUL2MqiNuKSCO5vg3WSiyJ8FcxDpBk4xMcrSB8RVHpj.	active	2026-04-20 09:44:36.258	2026-04-20 09:44:36.258
\.


--
-- TOC entry 4135 (class 0 OID 42623)
-- Dependencies: 221
-- Data for Name: UserProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserProfile" (id, user_id, prefix, first_name, last_name, house_no, moo, road, province, district, subdistrict, postal_code) FROM stdin;
71785d3e-b04e-43ee-b6c7-215e2e8cb67e	c1a778c8-2e5f-4739-8126-647c85b73d81	\N	Admin	Demo	\N	\N	\N	\N	\N	\N	\N
3ddb587e-a87a-436f-bc06-923fdadac073	eeb9fb08-5edf-4d42-b456-6a467ac54924	\N	User	Demo	\N	\N	\N	\N	\N	\N	\N
2e3cdde5-cf80-40ac-845d-131496e8d0ad	1a6cfd48-6b74-4ed1-bd5d-7a9f758903a3	\N	Tech	Demo	\N	\N	\N	\N	\N	\N	\N
\.


--
-- TOC entry 4145 (class 0 OID 42754)
-- Dependencies: 231
-- Data for Name: Warehouse; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Warehouse" (id, code, name, status, created_at) FROM stdin;
c179a56a-df5d-411b-bea4-c148b72842be	WH-01	คลัง 1	inactive	2026-04-20 09:44:36.279
\.


--
-- TOC entry 4133 (class 0 OID 42465)
-- Dependencies: 219
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
f9c322f3-3c69-44c8-a3e7-3e88e9f76bad	1f2d4e3b481fa0d8ed7d52583632e7ebd24c2c4d8d1dc7e4e4c766071f822867	2026-04-20 16:44:33.623353+07	20260131063434_y	\N	\N	2026-04-20 16:44:33.586405+07	1
ae90dc26-f224-408a-8c96-e6d211353ba9	0ca3406ebd9eed6ea554b62e8d88a9b1ce52e041280aa4f276f4808a23525ccc	2026-04-20 16:44:33.650296+07	20260416_formula_items_product_ref	\N	\N	2026-04-20 16:44:33.648826+07	1
53cad2da-31d9-4f86-923e-49ea7c15fb9b	808416ea4d900f71c271d6df580de2b4799500f2acaa0cf87325fd47c8c7d41d	2026-04-20 16:44:33.625133+07	20260202161040_add_glass_type_dimensions	\N	\N	2026-04-20 16:44:33.623845+07	1
07386af5-8e50-4239-b91c-6537fc9ab08f	a6e6f05761360dcecc5f58d811fdff09c6eab8d258fe9eb3e604501265c96ab5	2026-04-20 16:44:33.628544+07	20260204151042_add_formula_fields	\N	\N	2026-04-20 16:44:33.625793+07	1
4ea01a2e-ff92-45ec-9fef-b4c984383ace	f4baf1a57d7877352dc25ec54faa249e5cb8e8cadb5bd300ab6f124e2d1c8c43	2026-04-20 16:44:33.632087+07	20260204154734_add_aluminium_items	\N	\N	2026-04-20 16:44:33.628971+07	1
57373f78-c0a0-4cf0-ac86-7763f9c524e8	0c673d8b4c17c135a3e8b0cb58007e84c79a81e1639787d258f5d7d5c6ce073e	2026-04-20 17:16:27.973514+07	20260416_formula_prices	\N	\N	2026-04-20 17:16:27.970861+07	1
94580860-2fa1-4362-9a98-d66562edf4d1	76cff9ee36056bbdd4078b363c4b5fcb5416cf687daded7bdc9cd8fba3d91fda	2026-04-20 16:44:33.633631+07	20260204171523_add_formula_description	\N	\N	2026-04-20 16:44:33.632517+07	1
5c67dc25-06dd-4610-9e57-3902ca9f23f4	7bd2f769ef588959779540d9322a73fbfbbc3cd089940f04752a1c33e7bf97b8	2026-04-20 16:44:33.636987+07	20260205161706_add_stock_movement	\N	\N	2026-04-20 16:44:33.634036+07	1
00222d54-d949-4da0-8913-d0d1f64e2b38	13b596b0d900e11ae70f89e5f02accb85792d796aae3b78e53dea40bd22935bb	2026-04-20 16:44:33.638866+07	20260206170115_add_glass_offset_to_formula	\N	\N	2026-04-20 16:44:33.637448+07	1
7b187e3c-26ca-44a2-9a57-5f5afaaa5da8	47f14f5344929a194e8625182ed4a9cf46a9c2ed874bf2d7cbfe13e759ac1241	2026-04-20 17:16:27.975519+07	20260416_project_item_price	\N	\N	2026-04-20 17:16:27.973988+07	1
30da8c02-a55e-4280-a6f6-e6a2a9e0d9cb	9267a63acf93320f4ffffe897db0be4b4d078a325f1897941aeacdf84901d850	2026-04-20 16:44:33.640354+07	20260206171857_add_model_path_to_formula	\N	\N	2026-04-20 16:44:33.639235+07	1
95e7b2dc-2510-413b-b3f1-fc4a5c4f3971	9508f8dd86cc6f684c630983cc5979334ed42c5086bc2666671c7b97028664eb	2026-04-20 16:44:33.642545+07	20260207094034_add_project_item_fields	\N	\N	2026-04-20 16:44:33.640641+07	1
e494b122-84bf-4b00-b420-736b1bff18c9	30291b9350855278e1e61572389e32bf513dc34e0f8a745c0b92b9d93ffeed59	2026-04-20 16:44:33.643792+07	20260207100218_add_project_item_status	\N	\N	2026-04-20 16:44:33.642884+07	1
d71bb09d-19d2-42f8-9bd3-c79e3fec2c29	61b2d38809892f87ef65c4ae2b3751c5e4c79bc36d937e3490826fdfee8172ae	2026-04-20 17:16:28.613375+07	20260420101628_formula_prices	\N	\N	2026-04-20 17:16:28.604393+07	1
b5edd883-7da4-4a4c-8db9-d8523ec11f3d	335f5661e2afebd62d90da9edb96c9872c9cd4ff6383bbee48c8617e0627ca59	2026-04-20 16:44:33.645655+07	20260208091602_add_order_item_details	\N	\N	2026-04-20 16:44:33.644064+07	1
9b7eac3f-dfad-4736-8b70-b2ecd888be75	5ae46525506d714f5aca9a1b531aecf7283585c6670b3be2b29add1b6a47e4e0	2026-04-20 16:44:33.646811+07	20260404094656_add_project_building_soi	\N	\N	2026-04-20 16:44:33.645965+07	1
337065b9-8fd1-46d9-9c47-de4807997d77	2a6d611b6eb1fb846c62b1c65cd47c251b54b833b439bea44f0b1636ad164c8b	2026-04-20 16:44:33.648537+07	20260411111937_add_quotation_detail_fields	\N	\N	2026-04-20 16:44:33.647115+07	1
cde64d26-d0af-4293-b026-8f4e9fa4dc96	ed6bcb41ab67abef49f727af817960e761bfca53bdd60c0cce76d09bf67a4827	2026-04-20 17:45:33.399946+07	20260416_formula_product_ref	\N	\N	2026-04-20 17:45:33.396033+07	1
\.


--
-- TOC entry 4160 (class 0 OID 43155)
-- Dependencies: 246
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_movements (id, warehouse_id, product_id, type, quantity, reference, note, created_by, created_at) FROM stdin;
6295aff2-f02e-4433-a4df-f0a04becedac	c179a56a-df5d-411b-bea4-c148b72842be	30ef51d4-2fcf-449d-a08b-4597fc2ab8a0	IN	20	test	\N	c1a778c8-2e5f-4739-8126-647c85b73d81	2026-04-23 12:03:17.668
4beb0e77-0db1-4ddb-bb9e-9eee5ae3bff0	c179a56a-df5d-411b-bea4-c148b72842be	30ef51d4-2fcf-449d-a08b-4597fc2ab8a0	IN	10	terst3	\N	c1a778c8-2e5f-4739-8126-647c85b73d81	2026-04-23 12:03:37.566
\.


--
-- TOC entry 3892 (class 2606 OID 42647)
-- Name: AdminApproval AdminApproval_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdminApproval"
    ADD CONSTRAINT "AdminApproval_pkey" PRIMARY KEY (id);


--
-- TOC entry 3940 (class 2606 OID 43141)
-- Name: AluminiumItem AluminiumItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AluminiumItem"
    ADD CONSTRAINT "AluminiumItem_pkey" PRIMARY KEY (id);


--
-- TOC entry 3902 (class 2606 OID 42714)
-- Name: Brand Brand_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Brand"
    ADD CONSTRAINT "Brand_pkey" PRIMARY KEY (id);


--
-- TOC entry 3904 (class 2606 OID 42727)
-- Name: Color Color_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Color"
    ADD CONSTRAINT "Color_pkey" PRIMARY KEY (id);


--
-- TOC entry 3936 (class 2606 OID 42938)
-- Name: EtaxRequest EtaxRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EtaxRequest"
    ADD CONSTRAINT "EtaxRequest_pkey" PRIMARY KEY (id);


--
-- TOC entry 3919 (class 2606 OID 42829)
-- Name: FormulaItem FormulaItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FormulaItem"
    ADD CONSTRAINT "FormulaItem_pkey" PRIMARY KEY (id);


--
-- TOC entry 3917 (class 2606 OID 42817)
-- Name: Formula Formula_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Formula"
    ADD CONSTRAINT "Formula_pkey" PRIMARY KEY (id);


--
-- TOC entry 3908 (class 2606 OID 42753)
-- Name: GlassThickness GlassThickness_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GlassThickness"
    ADD CONSTRAINT "GlassThickness_pkey" PRIMARY KEY (id);


--
-- TOC entry 3906 (class 2606 OID 42740)
-- Name: GlassType GlassType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GlassType"
    ADD CONSTRAINT "GlassType_pkey" PRIMARY KEY (id);


--
-- TOC entry 3912 (class 2606 OID 42782)
-- Name: Inventory Inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Inventory"
    ADD CONSTRAINT "Inventory_pkey" PRIMARY KEY (id);


--
-- TOC entry 3938 (class 2606 OID 42953)
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- TOC entry 3931 (class 2606 OID 42911)
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- TOC entry 3929 (class 2606 OID 42898)
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- TOC entry 3933 (class 2606 OID 42925)
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- TOC entry 3898 (class 2606 OID 42688)
-- Name: ProductType ProductType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductType"
    ADD CONSTRAINT "ProductType_pkey" PRIMARY KEY (id);


--
-- TOC entry 3914 (class 2606 OID 42802)
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- TOC entry 3923 (class 2606 OID 42855)
-- Name: ProjectItem ProjectItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectItem"
    ADD CONSTRAINT "ProjectItem_pkey" PRIMARY KEY (id);


--
-- TOC entry 3921 (class 2606 OID 42846)
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- TOC entry 3927 (class 2606 OID 42884)
-- Name: QuotationItem QuotationItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QuotationItem"
    ADD CONSTRAINT "QuotationItem_pkey" PRIMARY KEY (id);


--
-- TOC entry 3925 (class 2606 OID 42871)
-- Name: Quotation Quotation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_pkey" PRIMARY KEY (id);


--
-- TOC entry 3896 (class 2606 OID 42675)
-- Name: SubscriptionPayment SubscriptionPayment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubscriptionPayment"
    ADD CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY (id);


--
-- TOC entry 3894 (class 2606 OID 42661)
-- Name: Subscription Subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_pkey" PRIMARY KEY (id);


--
-- TOC entry 3900 (class 2606 OID 42701)
-- Name: Unit Unit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Unit"
    ADD CONSTRAINT "Unit_pkey" PRIMARY KEY (id);


--
-- TOC entry 3889 (class 2606 OID 42633)
-- Name: UserProfile UserProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserProfile"
    ADD CONSTRAINT "UserProfile_pkey" PRIMARY KEY (id);


--
-- TOC entry 3887 (class 2606 OID 42622)
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- TOC entry 3910 (class 2606 OID 42767)
-- Name: Warehouse Warehouse_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Warehouse"
    ADD CONSTRAINT "Warehouse_pkey" PRIMARY KEY (id);


--
-- TOC entry 3884 (class 2606 OID 42478)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3942 (class 2606 OID 43168)
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- TOC entry 3934 (class 1259 OID 42957)
-- Name: EtaxRequest_order_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "EtaxRequest_order_id_key" ON public."EtaxRequest" USING btree (order_id);


--
-- TOC entry 3915 (class 1259 OID 42956)
-- Name: Product_sku_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Product_sku_key" ON public."Product" USING btree (sku);


--
-- TOC entry 3890 (class 1259 OID 42955)
-- Name: UserProfile_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserProfile_user_id_key" ON public."UserProfile" USING btree (user_id);


--
-- TOC entry 3885 (class 1259 OID 42954)
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- TOC entry 3944 (class 2606 OID 42968)
-- Name: AdminApproval AdminApproval_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdminApproval"
    ADD CONSTRAINT "AdminApproval_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3945 (class 2606 OID 42963)
-- Name: AdminApproval AdminApproval_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdminApproval"
    ADD CONSTRAINT "AdminApproval_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3981 (class 2606 OID 43108)
-- Name: EtaxRequest EtaxRequest_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EtaxRequest"
    ADD CONSTRAINT "EtaxRequest_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3961 (class 2606 OID 43033)
-- Name: FormulaItem FormulaItem_formula_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FormulaItem"
    ADD CONSTRAINT "FormulaItem_formula_id_fkey" FOREIGN KEY (formula_id) REFERENCES public."Formula"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3962 (class 2606 OID 43223)
-- Name: FormulaItem FormulaItem_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FormulaItem"
    ADD CONSTRAINT "FormulaItem_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3956 (class 2606 OID 43028)
-- Name: Formula Formula_glass_thickness_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Formula"
    ADD CONSTRAINT "Formula_glass_thickness_id_fkey" FOREIGN KEY (glass_thickness_id) REFERENCES public."GlassThickness"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3957 (class 2606 OID 43023)
-- Name: Formula Formula_glass_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Formula"
    ADD CONSTRAINT "Formula_glass_type_id_fkey" FOREIGN KEY (glass_type_id) REFERENCES public."GlassType"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3958 (class 2606 OID 49269)
-- Name: Formula Formula_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Formula"
    ADD CONSTRAINT "Formula_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3959 (class 2606 OID 43118)
-- Name: Formula Formula_product_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Formula"
    ADD CONSTRAINT "Formula_product_type_id_fkey" FOREIGN KEY (product_type_id) REFERENCES public."ProductType"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3960 (class 2606 OID 43123)
-- Name: Formula Formula_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Formula"
    ADD CONSTRAINT "Formula_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES public."Unit"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3949 (class 2606 OID 42993)
-- Name: Inventory Inventory_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Inventory"
    ADD CONSTRAINT "Inventory_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3950 (class 2606 OID 42988)
-- Name: Inventory Inventory_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Inventory"
    ADD CONSTRAINT "Inventory_warehouse_id_fkey" FOREIGN KEY (warehouse_id) REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3982 (class 2606 OID 43113)
-- Name: Notification Notification_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3975 (class 2606 OID 43210)
-- Name: OrderItem OrderItem_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_brand_id_fkey" FOREIGN KEY (brand_id) REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3976 (class 2606 OID 43205)
-- Name: OrderItem OrderItem_color_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_color_id_fkey" FOREIGN KEY (color_id) REFERENCES public."Color"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3977 (class 2606 OID 43088)
-- Name: OrderItem OrderItem_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3978 (class 2606 OID 43093)
-- Name: OrderItem OrderItem_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3973 (class 2606 OID 50807)
-- Name: Order Order_customer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_customer_user_id_fkey" FOREIGN KEY (customer_user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3974 (class 2606 OID 43083)
-- Name: Order Order_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3979 (class 2606 OID 43103)
-- Name: Payment Payment_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3980 (class 2606 OID 43098)
-- Name: Payment Payment_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3951 (class 2606 OID 43008)
-- Name: Product Product_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_brand_id_fkey" FOREIGN KEY (brand_id) REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3952 (class 2606 OID 43018)
-- Name: Product Product_formula_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_formula_id_fkey" FOREIGN KEY (formula_id) REFERENCES public."Formula"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3953 (class 2606 OID 42998)
-- Name: Product Product_product_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_product_type_id_fkey" FOREIGN KEY (product_type_id) REFERENCES public."ProductType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3954 (class 2606 OID 43003)
-- Name: Product Product_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES public."Unit"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3955 (class 2606 OID 43013)
-- Name: Product Product_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_warehouse_id_fkey" FOREIGN KEY (warehouse_id) REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3964 (class 2606 OID 43058)
-- Name: ProjectItem ProjectItem_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectItem"
    ADD CONSTRAINT "ProjectItem_brand_id_fkey" FOREIGN KEY (brand_id) REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3965 (class 2606 OID 43191)
-- Name: ProjectItem ProjectItem_color_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectItem"
    ADD CONSTRAINT "ProjectItem_color_id_fkey" FOREIGN KEY (color_id) REFERENCES public."Color"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3966 (class 2606 OID 43053)
-- Name: ProjectItem ProjectItem_formula_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectItem"
    ADD CONSTRAINT "ProjectItem_formula_id_fkey" FOREIGN KEY (formula_id) REFERENCES public."Formula"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3967 (class 2606 OID 43068)
-- Name: ProjectItem ProjectItem_glass_thickness_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectItem"
    ADD CONSTRAINT "ProjectItem_glass_thickness_id_fkey" FOREIGN KEY (glass_thickness_id) REFERENCES public."GlassThickness"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3968 (class 2606 OID 43063)
-- Name: ProjectItem ProjectItem_glass_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectItem"
    ADD CONSTRAINT "ProjectItem_glass_type_id_fkey" FOREIGN KEY (glass_type_id) REFERENCES public."GlassType"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3969 (class 2606 OID 43186)
-- Name: ProjectItem ProjectItem_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectItem"
    ADD CONSTRAINT "ProjectItem_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3970 (class 2606 OID 43048)
-- Name: ProjectItem ProjectItem_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectItem"
    ADD CONSTRAINT "ProjectItem_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3963 (class 2606 OID 43043)
-- Name: Project Project_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_created_by_id_fkey" FOREIGN KEY (created_by_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3972 (class 2606 OID 43078)
-- Name: QuotationItem QuotationItem_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QuotationItem"
    ADD CONSTRAINT "QuotationItem_quotation_id_fkey" FOREIGN KEY (quotation_id) REFERENCES public."Quotation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3971 (class 2606 OID 43073)
-- Name: Quotation Quotation_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3947 (class 2606 OID 42983)
-- Name: SubscriptionPayment SubscriptionPayment_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubscriptionPayment"
    ADD CONSTRAINT "SubscriptionPayment_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3948 (class 2606 OID 42978)
-- Name: SubscriptionPayment SubscriptionPayment_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubscriptionPayment"
    ADD CONSTRAINT "SubscriptionPayment_subscription_id_fkey" FOREIGN KEY (subscription_id) REFERENCES public."Subscription"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3946 (class 2606 OID 42973)
-- Name: Subscription Subscription_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3943 (class 2606 OID 42958)
-- Name: UserProfile UserProfile_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserProfile"
    ADD CONSTRAINT "UserProfile_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3983 (class 2606 OID 43179)
-- Name: stock_movements stock_movements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3984 (class 2606 OID 43174)
-- Name: stock_movements stock_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3985 (class 2606 OID 43169)
-- Name: stock_movements stock_movements_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4167 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


-- Completed on 2026-04-24 17:52:00 +07

--
-- PostgreSQL database dump complete
--

\unrestrict g4l1COF7aPKaOf6jguyc86fzyzHzCM3k43XPsHLkto4u1ootsOR6atFAZgffmc4

