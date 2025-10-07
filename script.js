document.addEventListener('DOMContentLoaded', function() {
    const iframe = document.getElementById('robot-iframe');
    
    // Aguarda o iframe carregar completamente
    iframe.onload = function() {
        document.addEventListener('mousemove', function(e) {
            // Calcula a posição relativa do mouse
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            
            // Envia a mensagem para o iframe com as coordenadas do mouse
            iframe.contentWindow.postMessage({
                type: 'mouse-position',
                x: x,
                y: y
            }, '*');
        });
    };
});