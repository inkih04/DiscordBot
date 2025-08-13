module.exports = {
    name: 'ready',
    type: 'shoukaku', 
    execute: (name, client) => {
        console.log(`✅ Nodo "${name}" conectado y listo.`);
    }
};
