import React from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiGrid } from "react-icons/fi";

const CatSlider = ({ data = [] }) => (
  <section className="store-section store-categories" id="categories" aria-labelledby="category-heading">
    <div className="store-section-heading"><div><span className="store-eyebrow">FIND YOUR ESSENTIALS</span><h2 id="category-heading">A little of everything you need.</h2></div><span className="store-section-note">Explore our categories</span></div>
    <div className="store-category-grid">
      {data.map((category, index) => <Link className={"store-category-card category-tone-" + index % 4} key={category.id || category._id} to={"/products/category/" + (category.id || category._id)}>
        <span className="store-category-image">{category.images?.[0] ? <img src={category.images[0]} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <FiGrid />}</span>
        <span>{category.name}<small>Explore collection</small></span><FiArrowUpRight />
      </Link>)}
    </div>
  </section>
);

export default CatSlider;
