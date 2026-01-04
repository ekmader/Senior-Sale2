-- Full-text search setup and categories for Senrio Sale

-- 1) Create a categories table and seed default categories
CREATE TABLE IF NOT EXISTS categories (
  name text PRIMARY KEY,
  label text NOT NULL
);

INSERT INTO categories (name, label) VALUES
  ('textbooks', 'Textbooks'),
  ('furniture', 'Furniture'),
  ('dorm', 'Dorm essentials'),
  ('cooking', 'Cooking'),
  ('decor', 'Decor'),
  ('clothing', 'Clothing')
ON CONFLICT (name) DO NOTHING;

-- 2) Add a GIN index for full-text search across title and description
CREATE INDEX IF NOT EXISTS items_fts_idx ON items USING GIN (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))
);

-- 3) RPC function to search items constrained to a university
create or replace function public.search_items(
  p_university uuid,
  p_query text,
  p_category text,
  p_limit int,
  p_offset int
) returns setof items language sql stable as $$
  select * from items
  where university_id = p_university
    and is_active = true
    and (p_category is null or p_category = '' or category = p_category)
    and (
      p_query is null
      or p_query = ''
      or to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')) @@ websearch_to_tsquery('english', p_query)
    )
  order by
    case when (p_query is null or p_query = '') then created_at end desc,
    case when (p_query is not null and p_query <> '') then ts_rank(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')), websearch_to_tsquery('english', p_query)) end desc,
    created_at desc
  limit coalesce(p_limit, 30) offset coalesce(p_offset, 0);
$$;

-- Grant execute for authenticated users (Supabase standard role: authenticated)
GRANT EXECUTE ON FUNCTION public.search_items(uuid, text, text, int, int) TO authenticated;

-- Helpful view to expose popular categories (optional)
create or replace view public.category_counts as
  select c.name, c.label, count(i.*) as item_count
  from categories c
  left join items i on i.category = c.name and i.is_active
  group by c.name, c.label
  order by item_count desc;
