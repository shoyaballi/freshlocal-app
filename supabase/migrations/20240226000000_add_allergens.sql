-- Add allergens column to meals table (Natasha's Law UK compliance)
ALTER TABLE meals ADD COLUMN allergens TEXT[] NOT NULL DEFAULT '{}';

-- Index for allergen filtering
CREATE INDEX idx_meals_allergens ON meals USING GIN(allergens);
