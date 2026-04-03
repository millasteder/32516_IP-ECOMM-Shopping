const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./database/db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// API: READ products
app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM products", (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

// API: READ cart (join with products)
app.get("/api/cart", (req, res) => {
  const sql = `
    SELECT cart_items.id as cart_item_id,
           cart_items.quantity,
           products.id as product_id,
           products.name,
           products.price,
           products.image_url
    FROM cart_items
    JOIN products ON cart_items.product_id = products.id
  `;

  db.all(sql, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

// API: CREATE add to cart
app.post("/api/cart", (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ error: "product_id is required" });

  db.get(
    "SELECT id, quantity FROM cart_items WHERE product_id = ?",
    [product_id],
    (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }

      // If already in cart, increase quantity
      if (row) {
        const newQty = row.quantity + 1;
        db.run(
          "UPDATE cart_items SET quantity = ? WHERE id = ?",
          [newQty, row.id],
          function (err2) {
            if (err2) {
              console.error(err2);
              return res.status(500).json({ error: "Database error" });
            }
            res.json({ id: row.id, product_id, quantity: newQty });
          }
        );
      } else {
        // Otherwise create new cart item
        db.run(
          "INSERT INTO cart_items (product_id, quantity) VALUES (?, 1)",
          [product_id],
          function (err2) {
            if (err2) {
              console.error(err2);
              return res.status(500).json({ error: "Database error" });
            }
            res.json({ id: this.lastID, product_id, quantity: 1 });
          }
        );
      }
    }
  );
});

// API: UPDATE quantity
app.put("/api/cart/:id", (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const q = Number(quantity);
  if (!Number.isInteger(q) || q < 1) {
    return res.status(400).json({ error: "quantity must be an integer >= 1" });
  }

  db.run(
    "UPDATE cart_items SET quantity = ? WHERE id = ?",
    [q, id],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      if (this.changes === 0) return res.status(404).json({ error: "Cart item not found" });
      res.json({ id: Number(id), quantity: q });
    }
  );
});

// API: DELETE remove item
app.delete("/api/cart/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM cart_items WHERE id = ?", [id], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    if (this.changes === 0) return res.status(404).json({ error: "Cart item not found" });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});