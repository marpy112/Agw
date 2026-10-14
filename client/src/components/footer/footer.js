import React, { useContext } from "react";
import { Link, NavLink } from "react-router-dom";
import { FiArrowUpRight, FiClock, FiHeart, FiHome, FiMail, FiMapPin, FiPhone, FiSearch, FiShoppingBag, FiSliders, FiUser } from "react-icons/fi";
import { MyContext } from "../../App";
import Logo from "../../assets/images/logo.png";
import "./footer.css";

const Footer = () => {
  const context = useContext(MyContext);
  const categories = context.categories?.categoryList || [];
  return (
    <>
      <div className="store-footer" role="contentinfo">
        <div className="store-container">
          <div className="store-footer-grid">
            <div className="store-footer-about"><Link className="store-brand" to="/"><img src={Logo} alt="" /><span>Rich Agri<span>YOUR EVERYDAY GROWING PARTNER</span></span></Link><p>Everyday essentials for the people who grow. From our community in Bukidnon to your farm and garden.</p><span className="store-footer-location"><FiMapPin /> TN Pepito St., Valencia City, Bukidnon</span></div>
            <div><h3>Explore the store</h3><Link to="/">Home</Link>{categories.slice(0, 4).map((category) => <Link key={category.id || category._id} to={"/products/category/" + (category.id || category._id)}>{category.name}</Link>)}{!categories.length && <Link to="/search">Browse products</Link>}</div>
            <div><h3>Your corner</h3><Link to={context.isLogin ? "/my-account" : "/signIn"}>My account</Link><Link to="/orders">My orders</Link><Link to="/myList">My wishlist</Link><Link to="/cart">Shopping cart</Link></div>
            <div className="store-footer-contact"><h3>Let’s talk</h3><a href="tel:+639367469404"><FiPhone /> +63 936 746 9404 <FiArrowUpRight /></a><a href="mailto:lacanielcapstone@gmail.com"><FiMail /> lacanielcapstone@gmail.com</a><span><FiClock /> Mon–Sat, 10:00 AM–6:00 PM</span><p>A question about your order?<br />We’re happy to help.</p></div>
          </div>
          <div className="store-footer-bottom"><span>© {new Date().getFullYear()} Rich Agri Store. All rights reserved.</span><span>Rooted in community. Growing together.</span></div>
        </div>
      </div>
      {context.isBottomShow && <div className="store-mobile-bottom" role="navigation" aria-label="Quick navigation">
        <NavLink to="/" end><FiHome /><span>Home</span></NavLink>
        {context.enableFilterTab ? <button aria-pressed={context.isOpenFilters} onClick={() => context.openFilters()}><FiSliders /><span>Filters</span></button> : <button onClick={context.openSearch}><FiSearch /><span>Search</span></button>}
        <NavLink to="/myList"><FiHeart /><span>Wishlist</span></NavLink>
        <NavLink to="/orders"><FiShoppingBag /><span>Orders</span></NavLink>
        <NavLink to={context.isLogin ? "/my-account" : "/signIn"}><FiUser /><span>Account</span></NavLink>
      </div>}
    </>
  );
};

export default Footer;
