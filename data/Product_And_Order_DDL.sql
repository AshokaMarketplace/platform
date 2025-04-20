--
-- 1. FOUNDERS
--
CREATE TABLE founders (
  id               VARCHAR(50)    PRIMARY KEY,
  name             VARCHAR(255)   NOT NULL,
  title            VARCHAR(100),
  image            VARCHAR(255),
  location         VARCHAR(255),
  upi_id           VARCHAR(100),
  upi_qr_code      VARCHAR(255),
  bio              TEXT,
  story            TEXT
);

CREATE TABLE founder_socials (
  founder_id       VARCHAR(50)    NOT NULL,
  platform         VARCHAR(50)    NOT NULL,   -- e.g. 'instagram', 'linkedin'
  url              VARCHAR(255)   NOT NULL,
  PRIMARY KEY (founder_id, platform),
  FOREIGN KEY (founder_id) REFERENCES founders(id)
);

CREATE TABLE founder_gallery (
  founder_id       VARCHAR(50)    NOT NULL,
  image_url        VARCHAR(255)   NOT NULL,
  position         INTEGER        DEFAULT 1,  -- ordering if you like
  PRIMARY KEY (founder_id, image_url),
  FOREIGN KEY (founder_id) REFERENCES founders(id)
);

--
-- 2. PRODUCTS
--
CREATE TABLE products (
  id               VARCHAR(50)    PRIMARY KEY,
  name             VARCHAR(255)   NOT NULL,
  category         VARCHAR(100),
  price            DECIMAL(10,2)  NOT NULL,
  description      TEXT,
  founder_id       VARCHAR(50)    NOT NULL,
  rating           INTEGER        DEFAULT 0,
  reviews          INTEGER        DEFAULT 0,
  in_stock         BOOLEAN        DEFAULT TRUE,
  dimensions       VARCHAR(100),
  care_instructions TEXT,
  created_at       DATE,
  FOREIGN KEY (founder_id) REFERENCES founders(id)
);

CREATE TABLE product_images (
  product_id       VARCHAR(50)    NOT NULL,
  image_url        VARCHAR(255)   NOT NULL,
  position         INTEGER        DEFAULT 1,
  PRIMARY KEY (product_id, image_url),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE product_features (
  product_id       VARCHAR(50)    NOT NULL,
  feature          TEXT           NOT NULL,
  PRIMARY KEY (product_id, feature),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE product_materials (
  product_id       VARCHAR(50)    NOT NULL,
  material         VARCHAR(100)   NOT NULL,
  PRIMARY KEY (product_id, material),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

--
-- 3. ORDERS & ORDER ITEMS
--
CREATE TABLE orders (
  id               VARCHAR(50)    PRIMARY KEY,
  customer_name    VARCHAR(100)   NOT NULL,
  email            VARCHAR(255)   NOT NULL,
  phone            VARCHAR(20),
  address          TEXT,
  amount           DECIMAL(10,2)  NOT NULL,
  status           VARCHAR(50)    NOT NULL,
  created_at       TIMESTAMP      NOT NULL
);

CREATE TABLE order_items (
  order_id         VARCHAR(50)    NOT NULL,
  product_id       VARCHAR(50)    NOT NULL,
  product_name     VARCHAR(255)   NOT NULL,  -- snapshot of name/price
  product_price    DECIMAL(10,2)  NOT NULL,
  quantity         INTEGER        NOT NULL,
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id)   REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
