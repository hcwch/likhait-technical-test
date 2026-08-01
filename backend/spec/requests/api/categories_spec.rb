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
end
