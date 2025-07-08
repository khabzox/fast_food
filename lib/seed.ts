import { ID } from "react-native-appwrite";
import { appwriteConfig, databases, storage } from "./appwrite";
import dummyData from "./data";

interface Category {
  name: string;
  description: string;
}

interface Customization {
  name: string;
  price: number;
  type: "topping" | "side" | "size" | "crust" | string; // extend as needed
}

interface MenuItem {
  name: string;
  description: string;
  image_url: string;
  price: number;
  rating: number;
  calories: number;
  protein: number;
  category_name: string;
  customizations: string[]; // list of customization names
}

interface DummyData {
  categories: Category[];
  customizations: Customization[];
  menu: MenuItem[];
}

// ensure dummyData has correct shape
const data = dummyData as DummyData;

async function clearAll(collectionId: string): Promise<void> {
  const list = await databases.listDocuments(
    appwriteConfig.databaseId!,
    collectionId
  );

  await Promise.all(
    list.documents.map((doc) =>
      databases.deleteDocument(appwriteConfig.databaseId!, collectionId, doc.$id)
    )
  );
}

async function clearStorage(): Promise<void> {
  const list = await storage.listFiles(appwriteConfig.bucketId!);

  await Promise.all(
    list.files.map((file) =>
      storage.deleteFile(appwriteConfig.bucketId!, file.$id)
    )
  );
}

async function uploadImageToStorage(imageUrl: string) {
  try {
    console.log('Uploading image:', imageUrl);
    
    // Add headers to mimic a browser request
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.log('Failed to fetch image, status:', response.status);
      return imageUrl; // Return original URL as fallback
    }
    
    const blob = await response.blob();
    console.log('Image fetched successfully, size:', blob.size);

    // Create a proper file object for React Native Appwrite
    const fileName = imageUrl.split("/").pop()?.split('?')[0] || `image-${Date.now()}.png`;
    const mimeType = blob.type || 'image/png';

    // Try creating with blob directly
    const fileObj = {
      name: fileName,
      type: mimeType,
      size: blob.size,
      uri: imageUrl,
    };

    console.log('Attempting to upload to Appwrite storage...');
    const file = await storage.createFile(
      appwriteConfig.bucketId!,
      ID.unique(),
      fileObj
    );

    const uploadedUrl = storage.getFileViewURL(appwriteConfig.bucketId!, file.$id);
    console.log('Image uploaded successfully to Appwrite:', file.$id);
    return uploadedUrl;
  } catch (error) {
    console.log('Error uploading image:', error);
    
    // Check if it's a specific Appwrite error
    if (error && typeof error === 'object' && 'message' in error) {
      console.log('Appwrite error message:', error.message);
    }
    
    console.log('Using original URL as fallback');
    return imageUrl; // Return original URL as fallback
  }
}

async function seed(): Promise<void> {
  // 1. Clear all
  await clearAll(appwriteConfig.categoriesCollectionId!);
  await clearAll(appwriteConfig.customizationsCollectionId!);
  await clearAll(appwriteConfig.menuCollectionId!);
  await clearAll(appwriteConfig.menuCustomizationsCollectionId!);
  await clearStorage();

  // 2. Create Categories
  const categoryMap: Record<string, string> = {};
  for (const cat of data.categories) {
    const doc = await databases.createDocument(
      appwriteConfig.databaseId!,
      appwriteConfig.categoriesCollectionId!,
      ID.unique(),
      cat
    );
    categoryMap[cat.name] = doc.$id;
  }

  // 3. Create Customizations
  const customizationMap: Record<string, string> = {};
  for (const cus of data.customizations) {
    const doc = await databases.createDocument(
      appwriteConfig.databaseId!,
      appwriteConfig.customizationsCollectionId!,
      ID.unique(),
      {
        name: cus.name,
        price: cus.price,
        type: cus.type,
      }
    );
    customizationMap[cus.name] = doc.$id;
  }

  // 4. Create Menu Items
  const menuMap: Record<string, string> = {};
  for (const item of data.menu) {
    console.log(`Processing menu item: ${item.name}`);
    
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    
    const uploadedImage = await uploadImageToStorage(item.image_url);

    const doc = await databases.createDocument(
      appwriteConfig.databaseId!,
      appwriteConfig.menuCollectionId!,
      ID.unique(),
      {
        name: item.name,
        description: item.description,
        image_url: uploadedImage,
        price: item.price,
        rating: item.rating,
        calories: item.calories,
        protein: item.protein,
        categories: categoryMap[item.category_name],
      }
    );

    menuMap[item.name] = doc.$id;

    // 5. Create menu_customizations
    for (const cusName of item.customizations) {
      await databases.createDocument(
        appwriteConfig.databaseId!,
        appwriteConfig.menuCustomizationsCollectionId!,
        ID.unique(),
        {
          menu: doc.$id,
          customizations: customizationMap[cusName],
        }
      );
    }
  }

  console.log("✅ Seeding complete.");
}

export default seed;
