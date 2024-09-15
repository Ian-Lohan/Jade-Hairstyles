const express = require('express');
const router = express.Router();
const multer = require('multer');
const AWSService = require('../services/aws');
const Servico = require('../models/servico');
const Arquivos = require('../models/arquivos');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ADD
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { file } = req;
        const servicoData = req.body;

        // Save the servico data to the database
        const servico = await new Servico(servicoData).save();

        // Upload the file to S3
        if (file) {
            const filename = `servicos/${servico._id}/${file.originalname}`;
            const uploadResult = await AWSService.uploadToS3(file, filename);

            if (uploadResult.error) {
                return res.json({ error: true, message: uploadResult.message });
            }

            // Create Arquivos document
            const arquivo = new Arquivos({
                referenciaId: servico._id,
                model: 'Servico',
                arquivo: filename,
            });
            await arquivo.save();
        }

        res.json({ servico });
    } catch (err) {
        res.json({ error: true, message: err.message });
    }
});

// UPDATE
router.put('/:id', upload.single('file'), async (req, res) => {
    try {
        const { file } = req;
        const servicoData = req.body;

        // Save the servico data to the database
        const servico = await Servico.findByIdAndUpdate(req.params.id, servicoData, { new: true });

        // Upload the file to S3
        if (file) {
            const filename = `servicos/${servico._id}/${file.originalname}`;
            const uploadResult = await AWSService.uploadToS3(file, filename);

            if (uploadResult.error) {
                return res.json({ error: true, message: uploadResult.message });
            }
        }

        res.json({ servico });
    } catch (err) {
        res.json({ error: true, message: err.message });
    }
});

// GET SALAO
router.get('/salao/:salaoId', async (req, res) => {
    try {
        let servicosSalao = [];

        const servicos = await Servico.find({
            salaoId: req.params.salaoId,
            status: { $ne: 'E' },
        });

        for (let servico of servicos) {
            const arquivos = await Arquivos.find({
                model: 'Servico',
                referenciaId: servico._id,
            });
            servicosSalao.push({ ...servico._doc, arquivos });
        }

        res.json({ servicos: servicosSalao });
    } catch (err) {
        res.json({ error: true, message: err.message });
    }
});

// DELETE FROM AWS AND DATABASE
router.post('/remove-arquivo', async (req, res) => {
    try {
        const { arquivo } = req.body;

        // EXCLUIR DA AWS
        const deleteResult = await AWSService.deleteFileS3(arquivo);
        if (deleteResult.error) {
            return res.json({ error: true, message: deleteResult.message });
        }

        // EXCLUIR DO BANCO DE DADOS
        await Arquivos.findOneAndDelete({ arquivo });

        res.json({ error: false, message: 'Arquivo excluído com sucesso!' });
    } catch (err) {
        res.json({ error: true, message: err.message });
    }
});

// DELETE (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const servico = await Servico.findByIdAndUpdate(id, { status: 'E' });
        res.json({ servico });
    } catch (err) {
        res.json({ error: true, message: err.message });
    }
});

module.exports = router;