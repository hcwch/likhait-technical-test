class Category < ApplicationRecord
  UNCATEGORIZED_NAME = "Uncategorized"

  has_many :expenses, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true, length: { maximum: 100 }

  scope :uncategorized, -> { where("LOWER(name) = ?", UNCATEGORIZED_NAME.downcase) }

  # Created on demand so it always exists, even when the schema was loaded without seeds.
  def self.uncategorized_category
    uncategorized.first || create!(name: UNCATEGORIZED_NAME)
  end

  def uncategorized?
    name.casecmp(UNCATEGORIZED_NAME).zero?
  end
end
