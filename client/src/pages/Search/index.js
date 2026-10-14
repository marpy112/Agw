import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import { MyContext } from "../../App";
import { fetchDataFromApi } from "../../utils/api";
import Product from "../../components/product";
import { ProductSkeletons } from "../Home";

const SearchPage = () => {
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  const { setEnableFilterTab } = useContext(MyContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState("relevance");

  useEffect(() => {
    let active = true;
    setEnableFilterTab(false);
    window.scrollTo(0, 0);
    if (!query.trim()) { setProducts([]); setLoading(false); return; }
    setLoading(true);
    fetchDataFromApi("/api/search?q=" + encodeURIComponent(query.trim())).then((response) => {
      if (active) { setProducts(Array.isArray(response) ? response : []); setLoading(false); }
    });
    return () => { active = false; };
  }, [query, setEnableFilterTab]);

  const sorted = useMemo(() => {
    const result = [...products];
    if (sort === "price-low") result.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-high") result.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "rating") result.sort((a, b) => Number(b.rating) - Number(a.rating));
    return result;
  }, [products, sort]);

  return <section className="store-container store-search-page">
    <Link className="store-text-link" to="/"><FiArrowLeft /> Back to the store</Link>
    <div className="store-section-heading"><div><span className="store-eyebrow">FIND SOMETHING GOOD</span><h1>{query ? 'Results for “' + query + '”' : "What are you looking for?"}</h1><p>{loading ? "Looking through our products…" : query ? products.length + " product" + (products.length === 1 ? "" : "s") + " found" : "Use the search bar above to explore the store."}</p></div>{products.length > 0 && <label className="store-sort">Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="relevance">Relevance</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="rating">Highest rated</option></select></label>}</div>
    {loading ? <ProductSkeletons /> : sorted.length ? <div className="store-product-grid">{sorted.map((product) => <Product key={product.id || product._id} item={product} />)}</div> : <div className="store-empty" role="status"><FiSearch /><h2>{query ? "No products to show" : "Your next find starts here"}</h2><p>{query ? "Try a different keyword or browse the categories in our store." : "Search by product name, brand, or growing essential."}</p><Link to="/" className="store-button">Explore the store</Link></div>}
  </section>;
};

export default SearchPage;
