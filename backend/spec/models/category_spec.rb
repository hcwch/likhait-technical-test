require 'rails_helper'

RSpec.describe Category, type: :model do
  describe "deleting a category with expenses" do
    it "is blocked by restrict_with_error" do
      category = Category.create!(name: "Pets")
      Expense.create!(description: "Dog food", amount: 20, category: category, date: Date.today)

      expect(category.destroy).to be(false)
      expect(category.errors[:base]).to include(/dependent expenses exist/)
      expect(Category.exists?(category.id)).to be(true)
    end
  end

  describe ".uncategorized_category" do
    it "creates the fallback bucket when none exists" do
      expect {
        Category.uncategorized_category
      }.to change(Category, :count).by(1)
    end

    it "reuses an existing bucket case-insensitively" do
      uncategorized = Category.create!(name: "uncategorized")

      expect(Category.uncategorized_category.id).to eq(uncategorized.id)
    end
  end
end
