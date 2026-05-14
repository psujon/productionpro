const express = require('express');
const router = express.Router();


// buyer management API 
app.get('/Buyer', async (req, res) => {
    try {
        const cacheKey = 'buyers';
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }

        // Use the pool created at startup if available
        const pool = global.dbPool || await mssql.connect(dbConfig);
        const sql = 'SELECT *  FROM tbl_buyer_info order by id desc';
        const result = await pool.request().query(sql);

        if (!result.recordset.length) {
            return res.status(404).json({ message: 'No data found' });
        }

        cache.set(cacheKey, result.recordset);
        res.json(result.recordset);

    } catch (err) {        
        res.status(500).json({ error: 'Database error' });
    }
})

app.post('/Buyer', async (req, res) => {
    console.log(req.path, req.method);
    try {
        const data = req.body;        
        // console.log(data);

        const pool = global.dbPool || await mssql.connect(dbConfig);
        const request = pool.request();
        // Parameterize all inputs to avoid SQL injection
        request.input('buyer', mssql.NVarChar(200), data.buyer);
        request.input('email', mssql.NVarChar(200), data.email);
        request.input('phone', mssql.NVarChar(50), data.phone);
        request.input('country', mssql.NVarChar(100), data.country);
        request.input('address', mssql.NVarChar(mssql.MAX), data.address);
        request.input('status', mssql.NVarChar(50), data.status);

        //Use OUTPUT INSERTED.id to get the identity value back
        const sql = `
            INSERT INTO tbl_buyer_info (buyer, email, phone, country, address, status)
            OUTPUT INSERTED.id
            VALUES (@buyer, @email, @phone, @country, @address, @status);
        `;

        const result = await request.query(sql);
        const insertedId = result.recordset && result.recordset[0] && result.recordset[0].id;

        // Invalidate cache
        cache.del('buyers');

        // return the inserted id and the created data
        res.status(201).json({ message: 'data successfully inserted' });
    } catch (err) {
        console.error('Insert Buyer error:', err);
        res.status(500).json({ error: 'Database insert error' });
    }
})
//update buyer data
app.put('/Buyer/:id', async (req, res) => {
    console.log(req.path, req.method);
    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid id' });
        }

        const data = req.body;
        console.log(data);

        const pool = global.dbPool || await mssql.connect(dbConfig);
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
            SET buyer = @buyer,
                email = @email,
                phone = @phone,
                country = @country,
                address = @address,
                status = @status
            WHERE id = @id;
        `;

        const result = await request.query(sql);

        if (result.rowsAffected && result.rowsAffected[0] > 0) {
            return res.status(200).json({ message: 'Successfully updated', id });
        } else {
            return res.status(404).json({ message: 'Not found' });
        }
    } catch (err) {
        console.error('Update Buyer error:', err);
        return res.status(500).json({ error: 'Database update error' });
    }
})
//delete buyer data
app.delete('/Buyer/:id', async (req, res) => {
    console.log(req.path, req.method);
    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid id' });
        }
        const pool = global.dbPool || await mssql.connect(dbConfig);
        const request = pool.request();
        request.input('id', mssql.Int, id);

        const sql = 'DELETE FROM tbl_buyer_info WHERE id = @id';
        const result = await request.query(sql);

        if (result.rowsAffected && result.rowsAffected[0] > 0) {
            return res.status(200).json({ message: 'Successfully deleted', id });
        } else {
            return res.status(404).json({ message: 'Not found' });
        }
    } catch (err) {
        console.error('Delete Buyer error:', err);
        res.status(500).json({ error: 'Database delete error' });
    }
})
//end buyer management API 



module.exports = router;