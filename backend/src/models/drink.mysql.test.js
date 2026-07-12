/**
 * 临时测试：DrinkBrandModel / DrinkModel MySQL 查询
 * 测试完成后可删除
 */
const { drinkBrandModel, drinkModel } = require('./drink');

(async () => {
  try {
    // 1. 查询全部品牌数量
    const brands = await drinkBrandModel.findAll({});
    console.log('=== 品牌总数 ===');
    console.log(brands.length);
    console.log();

    // 2. 查询全部饮品数量
    const drinks = await drinkModel.findAll({});
    console.log('=== 饮品总数 ===');
    console.log(drinks.length);
    console.log();

    // 3. 搜索"拿铁"
    const searchResult = await drinkModel.search('拿铁');
    console.log('=== 搜索"拿铁"结果 ===');
    console.log(JSON.stringify(searchResult, null, 2));
    console.log();

    // 4. 取第一个有饮品的品牌，查该品牌饮品
    const firstBrand = brands.find(b => b.isActive);
    if (firstBrand) {
      const brandDrinks = await drinkModel.findByBrand(firstBrand.id);
      console.log(`=== 品牌「${firstBrand.name}」(id=${firstBrand.id}) 的饮品 ===`);
      console.log(JSON.stringify(brandDrinks, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error('测试失败:', err);
    process.exit(1);
  }
})();
