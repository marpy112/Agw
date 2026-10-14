import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiBox, FiHeart, FiMapPin, FiRefreshCw, FiTruck } from "react-icons/fi";
import { MyContext } from "../../App";
import { fetchDataFromApi } from "../../utils/api";
import CatSlider from "../../components/catSlider";
import Product from "../../components/product";
import SliderBanner from "./slider";
import "./style.css";

export const ProductSkeletons = () => <div className="store-product-grid" role="status" aria-label="Loading products">{Array.from({ length: 4 }, (_, index) => <div className="store-product-skeleton" key={index}><div /><span /><span /><span /></div>)}</div>;

const Home = () => {
  const { categories, selectedCountry, setEnableFilterTab } = useContext(MyContext);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [slides, setSlides] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const categoryList = categories?.categoryList || [];

  useEffect(() => { window.scrollTo(0, 0); setEnableFilterTab(false); }, [setEnableFilterTab]);

  useEffect(() => {
    let active = true;
    const location = encodeURIComponent(selectedCountry || "All");
    const locationFilter = selectedCountry && selectedCountry !== "All" ? "?location=" + location : "";
    Promise.all([fetchDataFromApi("/api/products/featured" + locationFilter), fetchDataFromApi("/api/homeBanner"), fetchDataFromApi("/api/banners")]).then(([featuredData, slideData, bannerData]) => {
      if (!active) return;
      setFeatured(Array.isArray(featuredData) ? featuredData : []);
      setSlides(Array.isArray(slideData) ? slideData : []);
      setBanners(Array.isArray(bannerData) ? bannerData : []);
    });
    return () => { active = false; };
  }, [selectedCountry, retry]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const location = encodeURIComponent(selectedCountry || "All");
    const locationFilter = selectedCountry && selectedCountry !== "All" ? "&location=" + location : "";
    const endpoint = selectedCategory ? "/api/products/catId?catId=" + encodeURIComponent(selectedCategory) + "&location=" + location : "/api/products?page=1&perPage=12" + locationFilter;
    fetchDataFromApi(endpoint).then((response) => {
      if (!active) return;
      setProducts(Array.isArray(response?.products) ? response.products : []);
      setLoading(false);
    });
    return () => { active = false; };
  }, [selectedCategory, selectedCountry, retry]);

  return (
    <div className="store-home store-container">
      <section className="store-hero" aria-labelledby="hero-heading">
        <div className="store-hero-content"><span className="store-hero-kicker"><span /> FOR EVERY SEASON OF GROWTH</span><h1 id="hero-heading">Good things<br />start with <em>growth.</em></h1><p>From your backyard garden to your next big harvest, find the essentials to help you grow.</p><div className="store-hero-actions"><a className="store-button" href="#shop-products">Shop the collection <FiArrowRight /></a><a className="store-text-link" href={categoryList.length ? "#categories" : "#shop-products"}>Explore categories</a></div><span className="store-hero-location"><FiMapPin /> Proudly based in Bukidnon, Philippines</span></div>
        <div className="store-hero-note"><span className="store-leaf-mark">↗</span><div>A little care.<br /><strong>A lot of possibility.</strong></div></div>
        <span className="store-hero-caption">GROW MORE. LIVE WELL.</span>
      </section>
      <div className="store-benefits"><div><FiBox /><span><strong>Everyday essentials</strong><small>For your farm and garden</small></span></div><div><FiTruck /><span><strong>Shop from anywhere</strong><small>Your next order, made easy</small></span></div><div><FiHeart /><span><strong>Rooted in our community</strong><small>Growing together in Bukidnon</small></span></div></div>
      {categoryList.length > 0 && <CatSlider data={categoryList} />}
      <section className="store-section" id="shop-products" aria-labelledby="products-heading">
        <div className="store-section-heading"><div><span className="store-eyebrow">GOOD FINDS, READY TO GROW</span><h2 id="products-heading">Your next growing essentials.</h2></div><span className="store-section-note">A fresh start for every project</span></div>
        <div className="store-product-filters" role="group" aria-label="Filter products by category"><button className={!selectedCategory ? "is-selected" : ""} aria-pressed={!selectedCategory} onClick={() => setSelectedCategory("")}>All products</button>{categoryList.map((category) => <button key={category.id || category._id} aria-pressed={selectedCategory === (category.id || category._id)} className={selectedCategory === (category.id || category._id) ? "is-selected" : ""} onClick={() => setSelectedCategory(category.id || category._id)}>{category.name}</button>)}</div>
        {loading ? <ProductSkeletons /> : products.length ? <div className="store-product-grid">{products.map((item) => <Product key={item.id || item._id} item={item} />)}</div> : <div className="store-empty" role="status"><FiBox /><h3>No products to show just yet</h3><p>Try another category or refresh to check for available products.</p><button className="store-button store-button-light" onClick={() => setRetry((value) => value + 1)}><FiRefreshCw /> Refresh products</button></div>}
      </section>
      {slides.length > 0 && <div className="store-campaign"><SliderBanner data={slides} /></div>}
      {banners.length > 0 && <div className="store-promo-grid">{banners.filter((banner) => banner.images?.[0] && (banner.subCatId || banner.catId)).slice(0, 3).map((banner, index) => <Link key={banner.id || banner._id || index} to={banner.subCatId ? "/products/subCat/" + banner.subCatId : "/products/category/" + banner.catId}><img src={banner.images[0]} alt={banner.name || "Explore this collection"} loading="lazy" /></Link>)}</div>}
      {featured.length > 0 && <section className="store-section" aria-labelledby="featured-heading"><div className="store-section-heading"><div><span className="store-eyebrow">A CLOSER LOOK</span><h2 id="featured-heading">In the spotlight.</h2></div><a className="store-text-link" href="#shop-products">Keep exploring <FiArrowRight /></a></div><div className="store-product-grid">{featured.slice(0, 8).map((item) => <Product item={item} key={item.id || item._id} />)}</div></section>}
      <section className="store-community"><div><span className="store-eyebrow">YOUR LOCAL GROWING PARTNER</span><h2>Big plans. Small beginnings.<br />Let’s grow something good.</h2><p>Have a question about your next order? We’re here to help.</p></div><a className="store-button" href="tel:+639367469404">Talk to our team <FiArrowRight /></a></section>
    </div>
  );
};

export default Home;
