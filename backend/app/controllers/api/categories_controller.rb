class Api::CategoriesController < ApplicationController
  def index
    categories = Category.order(:name)
    render json: categories
  end

  def create
    category = Category.new(category_params)

    if category.save
      render json: category, status: :created
    elsif category.errors.of_kind?(:name, :taken)
      render json: { errors: category.errors.full_messages }, status: :conflict
    else
      render json: { errors: category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    category = Category.find(params[:id])

    if category.uncategorized?
      render json: { errors: [ "The Uncategorized category can't be renamed" ] }, status: :conflict
      return
    end

    if category_params[:name].to_s.casecmp(Category::UNCATEGORIZED_NAME).zero?
      render json: { errors: [ "The Uncategorized category name is reserved" ] }, status: :conflict
      return
    end

    if category.update(category_params)
      render json: category
    elsif category.errors.of_kind?(:name, :taken)
      render json: { errors: category.errors.full_messages }, status: :conflict
    else
      render json: { errors: category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    category = Category.find(params[:id])

    if category.uncategorized?
      render json: { errors: [ "The Uncategorized category can't be deleted" ] }, status: :conflict
      return
    end

    Category.transaction do
      category.expenses.update_all(category_id: Category.uncategorized_category.id) if category.expenses.any?
      category.destroy
    end

    head :no_content
  end

  private

  def category_params
    params.require(:category).permit(:name)
  end
end
