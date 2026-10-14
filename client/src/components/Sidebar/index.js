import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Drawer, Slider } from "@mui/material";
import Rating from "@mui/material/Rating";
import { FiX } from "react-icons/fi";
import { MyContext } from "../../App";
import { fetchDataFromApi } from "../../utils/api";

const Sidebar = ({ filterByRating, filterByPrice }) => {
  const [price, setPrice] = useState([0, 60000]);
  const [banners, setBanners] = useState([]);
  const context = useContext(MyContext);
  const { id } = useParams();
  const { setIsOpenFilters } = context;

  useEffect(() => {
    setPrice([0, 60000]);
    setIsOpenFilters(false);
  }, [id, setIsOpenFilters]);

  useEffect(() => {
    let active = true;
    fetchDataFromApi("/api/homeSideBanners").then((response) => {
      if (active) setBanners(Array.isArray(response) ? response : []);
    });
    return () => { active = false; };
  }, []);

  const close = () => setIsOpenFilters(false);
  const filters = <div className="store-filter-content">
    <div className="store-filter-section"><h3>Shop by category</h3>
      <div className="store-filter-categories">{context.categories?.categoryList?.map((category) => <Link className={id === (category.id || category._id) ? "is-selected" : ""} key={category.id || category._id} to={"/products/category/" + (category.id || category._id)} onClick={close}>{category.images?.[0] && <img src={category.images[0]} alt="" />}{category.name}</Link>)}</div>
    </div>
    <div className="store-filter-section"><h3>Price range</h3>
      <Slider value={price} onChange={(_, value) => setPrice(value)} min={0} max={60000} step={5} getAriaLabel={(index) => index === 0 ? "Minimum price" : "Maximum price"} valueLabelDisplay="auto" />
      <div className="store-price-range"><span>₱{price[0].toLocaleString()}</span><span>₱{price[1].toLocaleString()}</span></div>
      <button className="store-button store-button-light" onClick={() => { filterByPrice(price, id); close(); }}>Apply price range</button>
    </div>
    <div className="store-filter-section"><h3>Customer rating</h3>
      <div className="store-rating-filters">{[5, 4, 3, 2, 1].map((rating) => <button key={rating} aria-label={"Filter by " + rating + " stars"} onClick={() => { filterByRating(rating); close(); }}><Rating value={rating} size="small" readOnly /><span>{rating} stars</span></button>)}</div>
    </div>
    {banners.filter((banner) => banner.images?.[0] && (banner.subCatId || banner.catId)).map((banner, index) => <Link className="store-filter-banner" key={banner.id || banner._id || index} to={banner.subCatId ? "/products/subCat/" + banner.subCatId : "/products/category/" + banner.catId} onClick={close}><img src={banner.images[0]} alt={banner.name || "Explore this collection"} loading="lazy" /></Link>)}
  </div>;

  return context.windowWidth < 992 ? <Drawer open={context.isOpenFilters} onClose={close} PaperProps={{ className: "store-mobile-drawer store-filter-drawer" }}><div className="store-drawer-heading"><strong>Filter products</strong><button className="store-icon-button" aria-label="Close filters" onClick={close}><FiX /></button></div>{filters}</Drawer> : filters;
};

export default Sidebar;
