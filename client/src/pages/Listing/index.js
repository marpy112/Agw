import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiBox, FiX } from "react-icons/fi";
import Sidebar from "../../components/Sidebar";
import Product from "../../components/product";
import { MyContext } from "../../App";
import { fetchDataFromApi } from "../../utils/api";
import { ProductSkeletons } from "../Home";

const Listing = ({ single }) => {
  const { id } = useParams();
  const { categories, selectedCountry, setEnableFilterTab } = useContext(MyContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(null);
  const [category, setCategory] = useState(null);
  const activeFilter = filter?.category === id ? filter : null;
  const categoryList = categories?.categoryList || [];
  const categoryName = single
    ? categoryList.find((item) => (item.id || item._id) === id)?.name
    : categoryList.flatMap((item) => item.children || []).find((item) => (item.id || item._id) === id)?.name;
  const title = categoryName || category?.name || "Explore the collection";

  useEffect(() => {
    window.scrollTo(0, 0);
    setEnableFilterTab(true);
    return () => setEnableFilterTab(false);
  }, [id, setEnableFilterTab]);

  useEffect(() => {
    let active = true;
    setCategory(null);
    fetchDataFromApi("/api/category/" + encodeURIComponent(id)).then((response) => {
      if (active) setCategory(response?.categoryData?.[0] || null);
    });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({ [single ? "catId" : "subCatId"]: id, location: selectedCountry || "All" });
    let endpoint = single ? "catId" : "subCatId";
    if (activeFilter?.kind === "price") {
      endpoint = "fiterByPrice";
      params.set("minPrice", activeFilter.price[0]);
      params.set("maxPrice", activeFilter.price[1]);
    }
    if (activeFilter?.kind === "rating") {
      endpoint = "rating";
      params.set("rating", activeFilter.rating);
    }
    fetchDataFromApi("/api/products/" + endpoint + "?" + params.toString()).then((response) => {
      if (!active) return;
      setProducts(Array.isArray(response?.products) ? response.products : []);
      setLoading(false);
    });
    return () => { active = false; };
  }, [id, single, selectedCountry, activeFilter]);

  return <section className="store-container store-listing-page">
    <div className="store-listing-breadcrumb"><Link to="/">Home</Link><span>/</span><span>{title}</span></div>
    <div className="store-section-heading"><div><span className="store-eyebrow">FIND YOUR NEXT GROWING ESSENTIAL</span><h1>{title}</h1><p>{loading ? "Finding your essentials…" : products.length + " product" + (products.length === 1 ? "" : "s") + " to explore"}</p></div>{activeFilter && <button className="store-clear-filter" onClick={() => setFilter(null)}><FiX /> Clear filter</button>}</div>
    <div className="store-listing-layout">
      <aside aria-label="Product filters"><Sidebar filterByPrice={(price) => setFilter({category:id,kind:"price",price})} filterByRating={(rating) => setFilter({category:id,kind:"rating",rating})} /></aside>
      <div className="store-listing-content">
        {loading ? <ProductSkeletons /> : products.length ? <div className="store-product-grid">{products.map((product) => <Product key={product.id || product._id} item={product} />)}</div> : <div className="store-empty" role="status"><FiBox /><h2>No products to show</h2><p>{activeFilter ? "Try clearing your filter to see more products." : "Explore another category for more growing essentials."}</p>{activeFilter ? <button className="store-button" onClick={() => setFilter(null)}>Clear filter</button> : <Link className="store-button" to="/">Back to the store</Link>}</div>}
      </div>
    </div>
  </section>;
};

export default Listing;
