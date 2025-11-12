<template>
  <label class="model">
    Upscale Engine
    <select :value="modelKey" @change="$emit('update:modelKey', ($event.target as HTMLSelectElement).value)">

      <optgroup label="LDD Crystal Engines (RealESRGAN)">
        <option 
          value="realesrgan/general_fast-64"
          title="Good for everyday photos. Balanced speed and quality."
        >
          LDD Crystal Standard
        </option>

        <option 
          value="realesrgan/general_plus-64"
          title="Highest photo quality. Ideal for Etsy listings, printables, and high-detail product images."
        >
          LDD Crystal HD (Recommended)
        </option>

        <option 
          value="realesrgan/anime_fast-64"
          title="Optimized for stickers, cartoons, emojis, and flat-color art."
        >
          LDD Crystal Linework
        </option>

        <option 
          value="realesrgan/anime_plus-64"
          title="Best for detailed line art, manga-style designs, and illustrations."
        >
          LDD Crystal Linework Pro
        </option>
      </optgroup>

      <optgroup label="LDD Emerald Engines (RealCUGAN)">
        <option 
          value="realcugan/2x-conservative-64"
          title="Cleans edges and smooths small graphics. Great for logos, icons, and UI assets."
        >
          LDD Emerald 2× Clean
        </option>

        <option 
          value="realcugan/4x-conservative-64"
          title="High-quality 4× upscale for clean digital art, app/game graphics, and icons."
        >
          LDD Emerald 4× Clean
        </option>
      </optgroup>

    </select>
  </label>
</template>

<script setup lang="ts">
defineProps<{ modelKey: string }>();
defineEmits<{ "update:modelKey": [string] }>();
</script>

<style scoped>
.model {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}
select {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 4px 6px;
  font-size: 12px;
}
</style>
