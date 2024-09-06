const express = require('express');
const router = express.Router();
const Busboy = require('busboy');
const aws = require('../services/aws');
const Arquivo = require('../models/arquivo');
const Servico = require('../models/servico');

// ROTA RECEBE FORMDATA
router.post('/', async (req, res) => {
    let busboy = new Busboy({ headers: req.headers });
    busboy.on('finish', async () => {
        try {
            const { salaoId, servico } = req.body;
            let errors = [];
            let arquivos = [];

            /*
            {
                "123123123": {...},
                "123123123": {...},
                "123123123": {...}
            }
            */

            console.log(req.files);

            /*
            if (req.files && Object.keys(req.files) > 0) {
                for (let key of Object.keys(req.files)) {
                    const file = req.files[key];

                    // 123123123.jpg
                    const nameParts = file.name.slkit('.'); //[123123123, jpg]
                    const fileName = `${new Date().getTime()}.${
                        nameParts[nameParts.length - 1]
                    }`;
                    const path = `servicos/${salaoId}/${fileName}`;
                    
                    const response = await aws.uploadToS3(file, path);

                    if (response.error) {
                        errors.push({ error: true, message: response.message.message });
                    } else {
                        arquivos.push(path);
                    }
                }
            }
            */

            if (errors.length > 0) {
                res.json(errors[0]);
                return false;
            }

            // CRIAR SERVIÇO
            let jsonServico = JSON.parse(servico);
            const servicoCadastrado = await Servico(jsonServico).save();

            // CRIAR ARQUIVO
            arquivos = arquivos.map((arquivo) => ({
                referenciaId: servicoCadastrado._id,
                model: 'Servico',
                caminho: arquivo,
            }));

            await Arquivo.insertMany(arquivos);

            res.json({ servico: servicoCadastrado, arquivos });

        } catch (err) {
            res.json({ error: true, message: err.message });
        }
    });
    req.pipe(busboy);
});

module.exports = router;