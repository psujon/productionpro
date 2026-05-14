const { getPool, mssql } = require('../config/db');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const getBuyers = async (req, res) => {
    try {
        const cachedData = cache.get('buyers');
        if (cachedData) return res.json(cachedData);

        const pool = await getPool();
        const sql = 'SELECT * FROM tbl_buyer_info ORDER BY id DESC';
        const result = await pool.request().query(sql);

        if (!result.recordset.length) {
            return res.status(404).json({ message: 'No data found' });
        }

        cache.set('buyers', result.recordset);
        res.json(result.recordset);
    } catch (err) {
        console.error('Get Buyers Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const createBuyer = async (req, res) => {
    try {
        const data = req.body;
        const pool = await getPool();
        const request = pool.request();

        request.input('buyer', mssql.NVarChar(200), data.buyer);
        request.input('email', mssql.NVarChar(200), data.email);
        request.input('phone', mssql.NVarChar(50), data.phone);
        request.input('country', mssql.NVarChar(100), data.country);
        request.input('address', mssql.NVarChar(mssql.MAX), data.address);
        request.input('status', mssql.NVarChar(50), data.status);

        const sql = `
            INSERT INTO tbl_buyer_info (buyer, email, phone, country, address, status)
            OUTPUT INSERTED.id
            VALUES (@buyer, @email, @phone, @country, @address, @status);
        `;

        const result = await request.query(sql);
        cache.del('buyers');
        res.status(201).json({ message: 'Buyer successfully created', id: result.recordset[0].id });
    } catch (err) {
        console.error('Create Buyer Error:', err);
        res.status(500).json({ error: 'Database insert error' });
    }
};

const updateBuyer = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const data = req.body;
        const pool = await getPool();
        const request = pool.request();

        request.input('id', mssql.Int, id);
        request.input('buyer', mssql.NVarChar(200), data.buyer);
        request.input('email', mssql.NVarChar(200), data.email);
        request.input('phone', mssql.NVarChar(50), data.phone);
        request.input('country', mssql.NVarChar(100), data.country);
        request.input('address', mssql.NVarChar(mssql.MAX), data.address);
        request.input('status', mssql.NVarChar(50), data.status);

        const sql = `
            UPDATE tbl_buyer_info
            SET buyer = @buyer, email = @email, phone = @phone,
                country = @country, address = @address, status = @status
            WHERE id = @id;
        `;

        const result = await request.query(sql);
        if (result.rowsAffected[0] > 0) {
            cache.del('buyers');
            res.json({ message: 'Buyer successfully updated', id });
        } else {
            res.status(404).json({ message: 'Buyer not found' });
        }
    } catch (err) {
        console.error('Update Buyer Error:', err);
        res.status(500).json({ error: 'Database update error' });
    }
};

const deleteBuyer = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const pool = await getPool();
        const request = pool.request();
        request.input('id', mssql.Int, id);

        const sql = 'DELETE FROM tbl_buyer_info WHERE id = @id';
        const result = await request.query(sql);

        if (result.rowsAffected[0] > 0) {
            cache.del('buyers');
            res.json({ message: 'Buyer successfully deleted', id });
        } else {
            res.status(404).json({ message: 'Buyer not found' });
        }
    } catch (err) {
        console.error('Delete Buyer Error:', err);
        res.status(500).json({ error: 'Database delete error' });
    }
};

const getBuyerOrderList = async (req, res) => {
    try {
        const pool = await getPool();
        const limit = req.body.limit || 50;
        const sql = `select TOP (@limit) id, section, buyer, style, order_quantity, excessProduction, remarks from tbl_buyer_order_info where unit=@unit ORDER BY id DESC`;
        const result = await pool.request()
            .input('unit', mssql.NVarChar(200), req.body.unit)
            .input('limit', mssql.Int, limit)
            .query(sql);
        res.json(result.recordset || []);
    } catch (err) {
        console.error('Get Buyer Order List Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const createBuyerOrder = async (req, res) => {
    try {
        const data = req.body;
        const pool = await getPool();
        const request = pool.request();

        request.input('section', mssql.NVarChar(200), data.section);
        request.input('buyer', mssql.NVarChar(200), data.buyer);
        request.input('style', mssql.NVarChar(200), data.style);
        request.input('order_quantity', mssql.Int, data.order_quantity);
        request.input('excessProduction', mssql.NVarChar(50), data.excessProduction);
        request.input('remarks', mssql.NVarChar(mssql.MAX), data.remarks);
        request.input('unit', mssql.NVarChar(200), data.user.unit);

        const sql = `
            INSERT INTO tbl_buyer_order_info (section, buyer, style, order_quantity, excessProduction, remarks, unit)
            VALUES (@section, @buyer, @style, @order_quantity, @excessProduction, @remarks, @unit);
        `;

        await request.query(sql);
        res.status(201).json({ message: 'Order successfully created' });
    } catch (err) {
        console.error('Create Buyer Order Error:', err);
        res.status(500).json({ error: 'Database insert error' });
    }
};

const updateBuyerOrder = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const data = req.body;
        const pool = await getPool();
        const request = pool.request();

        request.input('id', mssql.Int, id);
        request.input('section', mssql.NVarChar(200), data.section);
        request.input('buyer', mssql.NVarChar(200), data.buyer);
        request.input('style', mssql.NVarChar(200), data.style);
        request.input('order_quantity', mssql.Int, data.order_quantity);
        request.input('excessProduction', mssql.NVarChar(50), data.excessProduction);
        request.input('remarks', mssql.NVarChar(mssql.MAX), data.remarks);

        const sql = `
            UPDATE tbl_buyer_order_info
            SET section = @section, buyer = @buyer, style = @style,
                order_quantity = @order_quantity, excessProduction = @excessProduction,
                remarks = @remarks
            WHERE id = @id;
        `;

        const result = await request.query(sql);
        if (result.rowsAffected[0] > 0) {
            res.json({ message: 'Order successfully updated', id });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (err) {
        console.error('Update Buyer Order Error:', err);
        res.status(500).json({ error: 'Database update error' });
    }
};

const deleteBuyerOrder = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const pool = await getPool();
        const request = pool.request();
        request.input('id', mssql.Int, id);

        const sql = 'DELETE FROM tbl_buyer_order_info WHERE id = @id';
        const result = await request.query(sql);

        if (result.rowsAffected[0] > 0) {
            res.json({ message: 'Order successfully deleted', id });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (err) {
        console.error('Delete Buyer Order Error:', err);
        res.status(500).json({ error: 'Database delete error' });
    }
};

module.exports = {
    getBuyers,
    createBuyer,
    updateBuyer,
    deleteBuyer,
    getBuyerOrderList,
    createBuyerOrder,
    updateBuyerOrder,
    deleteBuyerOrder
};
