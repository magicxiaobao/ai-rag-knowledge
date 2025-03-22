#!/usr/bin/env node

/**
 * 配置检查脚本 - 验证 Tailwind CSS 配置是否正确
 */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// 读取文件内容
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// 主检查函数
async function checkConfig() {
  console.log('开始检查前端配置问题...');
  
  // 1. 检查 postcss.config.js
  const postcssPath = path.join(process.cwd(), 'postcss.config.js');
  if (!fileExists(postcssPath)) {
    console.error('❌ postcss.config.js 文件不存在!');
    return;
  }
  
  const postcssConfig = readFile(postcssPath);
  if (postcssConfig.includes('@tailwindcss/postcss')) {
    console.error('❌ postcss.config.js 仍然引用了 @tailwindcss/postcss 模块!');
    console.log('   应该改为使用 tailwindcss: {}');
    return;
  } else if (postcssConfig.includes('tailwindcss: {}')) {
    console.log('✅ postcss.config.js 配置正确');
  } else {
    console.warn('⚠️ postcss.config.js 可能有问题，请手动检查');
  }
  
  // 2. 检查 tailwind.config.js
  const tailwindPath = path.join(process.cwd(), 'tailwind.config.js');
  if (!fileExists(tailwindPath)) {
    console.error('❌ tailwind.config.js 文件不存在!');
    return;
  }
  
  const tailwindConfig = readFile(tailwindPath);
  if (tailwindConfig.includes('@tailwindcss/postcss/colors')) {
    console.error('❌ tailwind.config.js 仍然引用了 @tailwindcss/postcss/colors!');
    return;
  } else {
    console.log('✅ tailwind.config.js 配置正确');
  }
  
  // 3. 检查依赖版本
  console.log('正在检查依赖版本...');
  exec('pnpm list tailwindcss', (error, stdout, stderr) => {
    if (error) {
      console.error(`执行命令错误: ${error}`);
      return;
    }
    
    if (stdout.includes('tailwindcss 4')) {
      console.error('❌ 使用了 tailwindcss 4.x 版本，应降级到 3.x!');
    } else if (stdout.includes('tailwindcss 3')) {
      console.log('✅ 使用了正确的 tailwindcss 3.x 版本');
    } else {
      console.warn('⚠️ 无法确认 tailwindcss 版本，请手动检查');
    }
    
    // 4. 提供解决方案
    console.log('\n总结:');
    console.log('1. 确保 postcss.config.js 使用 tailwindcss: {} 而非 @tailwindcss/postcss: {}');
    console.log('2. 确保 tailwind.config.js 不引用 @tailwindcss/postcss/colors');
    console.log('3. 确保使用 tailwindcss 3.x 版本');
    console.log('4. 清除缓存: rm -rf .vite node_modules/.vite');
    console.log('5. 重新启动开发服务器: pnpm run dev');
  });
}

// 执行检查
checkConfig(); 