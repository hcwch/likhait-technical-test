require 'rails_helper'

RSpec.describe "Api::Categories", type: :request do
  describe "GET /api/categories" do
    let!(:food) { Category.create!(name: "Food") }
    let!(:transport) { Category.create!(name: "Transport") }
    let!(:supplies) { Category.create!(name: "Supplies") }

    it "returns all categories" do
      get "/api/categories"

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json.length).to eq(3)
      expect(json.map { |c| c["name"] }).to include("Food", "Transport", "Supplies")
    end

    it "returns categories in alphabetical order" do
      get "/api/categories"

      json = JSON.parse(response.body)
      expect(json.map { |c| c["name"] }).to eq([ "Food", "Supplies", "Transport" ])
    end
  end

  describe "POST /api/categories" do
    context "with a valid name" do
      it "creates a new category and returns it" do
        expect {
          post "/api/categories", params: { category: { name: "Travel" } }, as: :json
        }.to change(Category, :count).by(1)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["name"]).to eq("Travel")
        expect(json["id"]).to be_present
      end
    end

    context "with a duplicate name" do
      let!(:food) { Category.create!(name: "Food") }

      it "returns 409 with an error message, case-insensitively" do
        expect {
          post "/api/categories", params: { category: { name: "food" } }, as: :json
        }.not_to change(Category, :count)

        expect(response).to have_http_status(:conflict)
        json = JSON.parse(response.body)
        expect(json["errors"]).to include("Name has already been taken")
      end
    end

    context "with a blank name" do
      it "returns 422 with an error message" do
        expect {
          post "/api/categories", params: { category: { name: "" } }, as: :json
        }.not_to change(Category, :count)

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json["errors"]).to include("Name can't be blank")
      end
    end

    context "with a name over 100 characters" do
      it "returns 422 with an error message" do
        expect {
          post "/api/categories", params: { category: { name: "x" * 101 } }, as: :json
        }.not_to change(Category, :count)

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json["errors"]).to include("Name is too long (maximum is 100 characters)")
      end
    end
  end

  describe "PUT /api/categories/:id" do
    let!(:category) { Category.create!(name: "Pets") }

    context "with a valid name" do
      it "renames the category and returns it" do
        put "/api/categories/#{category.id}", params: { category: { name: "Pet Care" } }, as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json["name"]).to eq("Pet Care")
        expect(category.reload.name).to eq("Pet Care")
      end
    end

    context "with a duplicate name" do
      let!(:existing) { Category.create!(name: "Food") }

      it "returns 409 with an error message, case-insensitively" do
        put "/api/categories/#{category.id}", params: { category: { name: "food" } }, as: :json

        expect(response).to have_http_status(:conflict)
        json = JSON.parse(response.body)
        expect(json["errors"]).to include("Name has already been taken")
        expect(category.reload.name).to eq("Pets")
      end
    end

    context "with a blank name" do
      it "returns 422 with an error message" do
        put "/api/categories/#{category.id}", params: { category: { name: "" } }, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json["errors"]).to include("Name can't be blank")
        expect(category.reload.name).to eq("Pets")
      end
    end

    context "with a name over 100 characters" do
      it "returns 422 with an error message" do
        put "/api/categories/#{category.id}", params: { category: { name: "x" * 101 } }, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json["errors"]).to include("Name is too long (maximum is 100 characters)")
        expect(category.reload.name).to eq("Pets")
      end
    end

    context "renaming the Uncategorized category" do
      it "returns 409 and does not rename it" do
        uncategorized = Category.create!(name: "Uncategorized")

        put "/api/categories/#{uncategorized.id}", params: { category: { name: "Misc" } }, as: :json

        expect(response).to have_http_status(:conflict)
        expect(uncategorized.reload.name).to eq("Uncategorized")
      end
    end

    context "renaming another category to the reserved Uncategorized name" do
      it "returns 409 and does not rename it" do
        put "/api/categories/#{category.id}", params: { category: { name: "Uncategorized" } }, as: :json

        expect(response).to have_http_status(:conflict)
        expect(category.reload.name).to eq("Pets")
      end
    end

    context "with a nonexistent id" do
      it "returns 404" do
        put "/api/categories/999999", params: { category: { name: "Whatever" } }, as: :json

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "DELETE /api/categories/:id" do
    context "with no expenses" do
      it "deletes the category" do
        category = Category.create!(name: "Pets")

        expect {
          delete "/api/categories/#{category.id}"
        }.to change(Category, :count).by(-1)

        expect(response).to have_http_status(:no_content)
      end
    end

    context "with expenses" do
      it "moves the expenses to Uncategorized and deletes the category" do
        category = Category.create!(name: "Pets")
        expense = Expense.create!(description: "Dog food", amount: 20, category: category, date: Date.today)

        delete "/api/categories/#{category.id}"

        expect(response).to have_http_status(:no_content)
        expect(Category.exists?(category.id)).to be(false)
        expect(expense.reload.category.name).to eq("Uncategorized")
      end

      it "reuses an existing Uncategorized category, case-insensitively" do
        category = Category.create!(name: "Pets")
        uncategorized = Category.create!(name: "uncategorized")
        expense = Expense.create!(description: "Dog food", amount: 20, category: category, date: Date.today)

        delete "/api/categories/#{category.id}"

        expect(expense.reload.category_id).to eq(uncategorized.id)
        expect(Category.where("LOWER(name) = ?", "uncategorized").count).to eq(1)
      end
    end

    context "deleting the Uncategorized category itself" do
      it "returns 409 even when it has no expenses" do
        uncategorized = Category.create!(name: "Uncategorized")

        expect {
          delete "/api/categories/#{uncategorized.id}"
        }.not_to change(Category, :count)

        expect(response).to have_http_status(:conflict)
        expect(Category.exists?(uncategorized.id)).to be(true)
      end

      it "returns 409 when it still has expenses" do
        uncategorized = Category.create!(name: "Uncategorized")
        Expense.create!(description: "Misc", amount: 5, category: uncategorized, date: Date.today)

        expect {
          delete "/api/categories/#{uncategorized.id}"
        }.not_to change(Category, :count)

        expect(response).to have_http_status(:conflict)
        expect(Category.exists?(uncategorized.id)).to be(true)
      end
    end

    context "with a nonexistent id" do
      it "returns 404" do
        delete "/api/categories/999999"

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
