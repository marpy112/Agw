import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button, Drawer, Menu, MenuItem } from "@mui/material";
import { FiArrowRight, FiChevronDown, FiGrid, FiHeart, FiMapPin, FiMenu, FiSearch, FiShoppingBag, FiUser, FiX } from "react-icons/fi";
import { MyContext } from "../../App";
import Logo from "../../assets/images/logo.png";
import "./header.css";

const Header = () => {
  const context = useContext(MyContext);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categoryAnchor, setCategoryAnchor] = useState(null);
  const [accountAnchor, setAccountAnchor] = useState(null);
  const [countries, setCountries] = useState([]);
  const categories = context.categories?.categoryList || [];
  const { isOpenSearch, closeSearch } = context;

  useEffect(() => {
    if (!drawerOpen || countries.length) return;
    const controller = new AbortController();
    fetch("https://countriesnow.space/api/v0.1/countries/", { signal: controller.signal })
      .then((response) => response.json())
      .then((response) => setCountries(Array.isArray(response.data) ? response.data.map((item) => item.country) : []))
      .catch(() => {});
    return () => controller.abort();
  }, [drawerOpen, countries.length]);

  useEffect(() => {
    setDrawerOpen(false);
    setCategoryAnchor(null);
    setAccountAnchor(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (isOpenSearch) {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      closeSearch();
    }
  }, [isOpenSearch, closeSearch]);

  const search = (event) => {
    event.preventDefault();
    if (query.trim()) navigate("/search?q=" + encodeURIComponent(query.trim()));
  };

  const logout = () => {
    context.signOut();
    context.setCartItems([]);
    context.setMyListData([]);
    setAccountAnchor(null);
    navigate("/signIn");
  };

  const categoryLink = (category) => "/products/category/" + (category.id || category._id);
  const childLink = (child) => "/products/subCat/" + (child.id || child._id);

  return (
    <div className="store-header" role="banner">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div className="store-announcement">
        <div className="store-container"><span>Rooted in agriculture. Growing with you.</span><span><FiMapPin /> Valencia City, Bukidnon</span></div>
      </div>
      <div className="store-container store-header-main">
        <button className="store-icon-button mobile-menu-trigger" aria-label="Open navigation" onClick={() => setDrawerOpen(true)}><FiMenu /></button>
        <Link className="store-brand" to="/" aria-label="Rich Agri Store home">
          <img src={Logo} alt="" /><span>Rich Agri<span>YOUR EVERYDAY GROWING PARTNER</span></span>
        </Link>
        <form className="store-search" role="search" onSubmit={search}>
          <FiSearch aria-hidden="true" />
          <input ref={inputRef} type="search" aria-label="Search products" placeholder="Search seeds, supplies, and more..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <button type="submit" aria-label="Search"><FiArrowRight /></button>
        </form>
        <div className="store-header-actions">
          <Link className="store-header-action wishlist-action" to="/myList"><span className="store-action-icon"><FiHeart />{context.myListData?.length > 0 && <span className="store-count">{context.myListData.length}</span>}</span><span>Wishlist</span></Link>
          <Link className="store-header-action" to="/cart" aria-label={"Cart, " + (context.cartItems?.length || 0) + " items"}><span className="store-action-icon"><FiShoppingBag /><span className="store-count">{context.cartItems?.length || 0}</span></span><span>My cart</span></Link>
          {context.isLogin ? <button className="store-header-action account-action" aria-haspopup="menu" aria-expanded={Boolean(accountAnchor)} onClick={(event) => setAccountAnchor(event.currentTarget)}><FiUser /><span>Account</span></button> : <Link className="store-sign-in" to="/signIn"><FiUser /><span>Sign in</span></Link>}
        </div>
      </div>
      <div className="store-navigation">
        <div className="store-container store-nav-inner" role="navigation" aria-label="Main navigation">
          <button className="store-category-button" aria-haspopup="menu" aria-expanded={Boolean(categoryAnchor)} onClick={(event) => setCategoryAnchor(event.currentTarget)}><FiGrid /> Shop by category <FiChevronDown /></button>
          <NavLink to="/" end>Home</NavLink>
          {categories.slice(0, 4).map((category) => <NavLink key={category.id || category._id} to={categoryLink(category)}>{category.name}</NavLink>)}
          <a className="store-nav-contact" href="tel:+639367469404">Need a hand? <strong>Contact us <FiArrowRight /></strong></a>
        </div>
      </div>
      <Menu anchorEl={categoryAnchor} open={Boolean(categoryAnchor)} onClose={() => setCategoryAnchor(null)} PaperProps={{ className: "store-dropdown" }}>
        {categories.length ? categories.map((category) => <div key={category.id || category._id}><MenuItem component={Link} to={categoryLink(category)} onClick={() => setCategoryAnchor(null)}>{category.name}</MenuItem>{category.children?.map((child) => <MenuItem className="store-subcategory" component={Link} key={child.id || child._id} to={childLink(child)} onClick={() => setCategoryAnchor(null)}>{child.name}</MenuItem>)}</div>) : <MenuItem disabled>Categories are currently unavailable</MenuItem>}
      </Menu>
      <Menu anchorEl={accountAnchor} open={Boolean(accountAnchor)} onClose={() => setAccountAnchor(null)} PaperProps={{ className: "store-dropdown" }}>
        <MenuItem component={Link} to="/my-account" onClick={() => setAccountAnchor(null)}>My account</MenuItem><MenuItem component={Link} to="/orders" onClick={() => setAccountAnchor(null)}>My orders</MenuItem><MenuItem onClick={logout}>Sign out</MenuItem>
      </Menu>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ className: "store-mobile-drawer" }}>
        <div className="store-drawer-heading"><strong>Rich Agri Store</strong><button className="store-icon-button" onClick={() => setDrawerOpen(false)} aria-label="Close navigation"><FiX /></button></div>
        <div role="navigation" aria-label="Mobile navigation" className="store-drawer-links">
          <label className="store-location-select">Shopping location<select value={context.selectedCountry || "All"} onChange={(event) => { localStorage.setItem("location", event.target.value); window.location.assign("/"); }}><option value="All">All locations</option>{[...new Set([context.selectedCountry, ...countries])].filter((country) => country && country !== "All").map((country) => <option key={country} value={country}>{country}</option>)}</select></label>
          <Link to="/" onClick={() => setDrawerOpen(false)}>Home <FiArrowRight /></Link>
          <span className="store-eyebrow">SHOP BY CATEGORY</span>
          {categories.map((category) => <div key={category.id || category._id}><Link to={categoryLink(category)} onClick={() => setDrawerOpen(false)}>{category.name}<FiArrowRight /></Link>{category.children?.map((child) => <Link className="store-drawer-child" key={child.id || child._id} to={childLink(child)} onClick={() => setDrawerOpen(false)}>{child.name}</Link>)}</div>)}
          {!categories.length && <p>Categories are currently unavailable.</p>}
          <Link to="/myList" onClick={() => setDrawerOpen(false)}>My wishlist <FiHeart /></Link><Link to="/orders" onClick={() => setDrawerOpen(false)}>My orders <FiShoppingBag /></Link>
          <Button className="store-button" component={Link} to={context.isLogin ? "/my-account" : "/signIn"} onClick={() => setDrawerOpen(false)}>{context.isLogin ? "My account" : "Sign in"}</Button>
        </div>
      </Drawer>
    </div>
  );
};

export default Header;
