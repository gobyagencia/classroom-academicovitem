<template>
  <div>
    <header class="bg-blue-600 text-white p-4">
      <div class="container mx-auto">
        <h1 class="text-2xl font-bold">Vitem Academy</h1>
        <p class="text-blue-100">Plataforma de aprendizaje</p>
      </div>
    </header>
    <main class="container mx-auto p-4">
      <slot />
    </main>
    <footer class="bg-gray-800 text-white p-4 mt-8">
      <div class="container mx-auto text-center">
        <p>&copy; 2024 Vitem Academy</p>
      </div>
    </footer>
  </div>
</template>
