import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import Rating from "@mui/material/Rating";
import { FiArrowUpRight, FiHeart, FiImage } from "react-icons/fi";
import { MyContext } from "../../App";
import { fetchDataFromApi, postData } from "../../utils/api";
import "./style.css";

const currency = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 });

const Product = ({ item }) => {
  const context = useContext(MyContext);
  const [saving, setSaving] = useState(false);
  const [failedImage, setFailedImage] = useState(null);
  if (!item) return null;
  const id = item.id || item._id;
  const saved = context.isLogin && context.myListData?.some((entry) => String(entry.productId) === String(id));
  const price = Number(item.price) || 0;
  const oldPrice = Number(item.oldPrice) || 0;
  const discount = oldPrice > price && price > 0 ? Math.round((1 - price / oldPrice) * 100) : 0;
  const outOfStock = item.countInStock != null && Number(item.countInStock) === 0;

  const saveProduct = async () => {
    if (!context.isLogin) {
      context.setAlertBox({ open: true, error: true, msg: "Sign in to save products to your wishlist." });
      return;
    }
    if (saving || saved) return;
    setSaving(true);
    try {
      const response = await postData("/api/my-list/add", { productTitle: item.name, image: item.images?.[0], rating: item.rating, price, productId: id, userId: context.user?.userId });
      if (!response || response.status === false || response.success === false) throw new Error(response?.msg || "We couldn’t save this product. Please try again.");
      const list = await fetchDataFromApi("/api/my-list?userId=" + context.user?.userId);
      context.setMyListData(Array.isArray(list) ? list : []);
      context.setAlertBox({ open: true, error: false, msg: "Product saved to your wishlist." });
    } catch (error) {
      context.setAlertBox({ open: true, error: true, msg: error.message });
    } finally { setSaving(false); }
  };

  return (
    <article className="store-product-card">
      <div className="store-product-media">
        <Link to={"/product/" + id} aria-label={"View " + item.name}>
          {item.images?.[0] && failedImage !== item.images[0] ? <img src={item.images[0]} alt={item.name} loading="lazy" onError={() => setFailedImage(item.images[0])} /> : <span className="store-image-fallback"><FiImage /><small>Image unavailable</small></span>}
        </Link>
        {outOfStock ? <span className="store-product-tag is-unavailable">Out of stock</span> : discount > 0 ? <span className="store-product-tag">{discount}% off</span> : item.isFeatured ? <span className="store-product-tag">Featured</span> : null}
        <button className={"store-wishlist-button" + (saved ? " is-saved" : "")} aria-label={saved ? item.name + " is in your wishlist" : "Save " + item.name + " to wishlist"} aria-pressed={Boolean(saved)} disabled={saving || Boolean(saved)} onClick={saveProduct}><FiHeart /></button>
      </div>
      <div className="store-product-info">
        <span className="store-product-category">{item.catName || "Growing essentials"}</span>
        <h3><Link to={"/product/" + id}>{item.name}</Link></h3>
        {item.brand && <span className="store-product-brand">{item.brand}</span>}
        <div className="store-product-rating"><Rating value={Number(item.rating) || 0} precision={0.5} size="small" readOnly /><span>{Number(item.rating) > 0 ? Number(item.rating).toFixed(1) : "Not yet rated"}</span></div>
        <div className="store-product-bottom"><div><strong>{currency.format(price)}</strong>{oldPrice > price && <del>{currency.format(oldPrice)}</del>}</div><Link to={"/product/" + id} className="store-product-view" aria-label={"View details for " + item.name}><FiArrowUpRight /></Link></div>
      </div>
    </article>
  );
};

export default Product;
