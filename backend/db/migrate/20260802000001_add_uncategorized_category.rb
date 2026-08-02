class AddUncategorizedCategory < ActiveRecord::Migration[7.2]
  def up
    Category.find_or_create_by!(name: "Uncategorized")
  end

  def down
    uncategorized = Category.where("LOWER(name) = ?", "uncategorized").first
    uncategorized&.destroy if uncategorized&.expenses&.none?
  end
end
