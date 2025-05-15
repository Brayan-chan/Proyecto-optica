// Función para manejar el cierre de sesión
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'index.html';
        });
    }
    
    // Verificar autenticación en páginas protegidas
    if (window.location.pathname !== '/index.html') {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            window.location.href = 'index.html';
        }
    }
});

// Funcionalidad común para modales
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('inventoryModal');
    if (modal) {
        const span = document.getElementsByClassName("close")[0];
        
        span.onclick = function() {
            modal.style.display = "none";
        }
        
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    }
});