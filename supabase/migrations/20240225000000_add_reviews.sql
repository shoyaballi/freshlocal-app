-- Reviews & Ratings table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, order_id)
);

COMMENT ON TABLE reviews IS 'Customer reviews for vendors after order completion';

-- Indexes
CREATE INDEX idx_reviews_vendor_id ON reviews(vendor_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_order_id ON reviews(order_id);
CREATE INDEX idx_reviews_vendor_rating ON reviews(vendor_id, rating);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (TRUE);

-- Users can create reviews for their completed orders
CREATE POLICY "Users can create reviews for completed orders"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = reviews.order_id
      AND orders.user_id = auth.uid()
      AND orders.status IN ('collected', 'delivered')
    )
  );

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Apply updated_at trigger
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update vendor rating average on review insert/update/delete
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_id UUID;
  avg_rating DECIMAL(2,1);
  total_reviews INTEGER;
BEGIN
  -- Get the vendor_id from the affected row
  IF TG_OP = 'DELETE' THEN
    v_id := OLD.vendor_id;
  ELSE
    v_id := NEW.vendor_id;
  END IF;

  -- Calculate new average
  SELECT COALESCE(AVG(rating)::DECIMAL(2,1), 0.0), COUNT(*)
  INTO avg_rating, total_reviews
  FROM reviews
  WHERE vendor_id = v_id;

  -- Update vendor
  UPDATE vendors
  SET rating = avg_rating, review_count = total_reviews
  WHERE id = v_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_changed
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_vendor_rating();
