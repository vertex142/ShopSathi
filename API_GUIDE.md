# ShopSathi Setup Guide for Smart Features

Welcome! To unlock ShopSathi's smartest features, like the **AI Assistant** and automatic **Google Drive Backups**, you'll need to connect the app to Google's services.

This guide will walk you through getting the necessary "keys" from Google. It might look technical, but it's just a few steps of clicking and copying. **No coding is required!**

---

### What You'll Get from this Guide

You will get two secret keys from Google's websites:

1.  **API Key**: Powers the AI features (like the AI Assistant).
2.  **Google Client ID**: Securely allows the app to back up your data to your personal Google Drive.

### Where to Put The Keys: Using Environment Variables

To keep your secret keys safe, we will **not** paste them directly into any code files. Instead, we use a secure feature provided by all modern web hosting services called **Environment Variables**.

Think of them as secure digital lockers for your app. Your app knows how to open these lockers to get the keys when it needs them, but the keys themselves are not stored in the public-facing code. This is the industry-standard way to handle sensitive information.

You will need to add your two keys to your hosting provider's settings. The process is generally the same everywhere:

1.  **Log in to your hosting provider's website** (e.g., Vercel, Netlify, Render, etc.).
2.  Navigate to the dashboard for your **ShopSathi project**.
3.  Look for a **"Settings"** tab or section.
4.  Inside Settings, find a sub-section called **"Environment Variables"**, "Secrets", or "Config Vars".
5.  You'll see an option to add a new variable. You will do this twice:

    *   **For your API Key:**
        *   Click "Add New Variable".
        *   In the **Name** (or **Key**) field, type exactly: `API_KEY`
        *   In the **Value** (or **Secret**) field, paste the **API Key** you copied from Google AI Studio.
        *   Save it.

    *   **For your Client ID:**
        *   Click "Add New Variable" again.
        *   In the **Name** (or **Key**) field, type exactly: `GOOGLE_CLIENT_ID`
        *   In the **Value** (or **Secret**) field, paste the **Client ID** you copied from the Google Cloud Console.
        *   Save it.

6.  **Important: Redeploy Your App!** After saving your variables, you must trigger a new "deployment" or "build" of your app. Your hosting service needs to restart the app to give it access to the new keys. Look for a "Deployments" tab and a button to "Redeploy" or "Trigger Deploy".

Once the new deployment is complete, your app will have access to the keys, and the smart features will be enabled.


---

## Part 1: Getting Your Google API Key (for AI features)

This key enables all AI features in the app.

1.  **Open Google AI Studio**
    *   In your web browser, go to the [Google AI Studio website](https://aistudio.google.com/).
    *   Sign in with your Google Account when prompted.

2.  **Get Your API Key**
    *   Click the **"Get API key"** button, usually found in the top-left corner.
    *   A small window will pop up. Click on the button that says **"Create API key in new project"**.
    *   Success! You'll see a long string of letters and numbers. This is your API Key.
    *   **Click the copy icon** next to the key to copy it.

3.  **Store Your API Key**
    *   Go to your hosting service's "Environment Variables" section.
    *   Create a new variable named `API_KEY`.
    *   Paste the copied key as the value for this variable and save it.

---

## Part 2: Getting Your Google Client ID (for Backups)

This ID allows the app to ask for your permission to save backup files to a private folder in your Google Drive.

1.  **Open the Google Cloud Console**
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   At the top of the page, you should see a project name (it might be called "Generative Language Client"). Make sure this is the selected project.

2.  **Go to the Credentials Page**
    *   On the left-side menu, you might need to click the 'hamburger' icon (☰) to open it.
    *   Find and click on **APIs & Services**, and then click on **Credentials**.

3.  **Create the Client ID**
    *   Click the **"+ CREATE CREDENTIALS"** button at the top of the page and choose **"OAuth client ID"** from the list.

4.  **First-Time Setup (if needed)**
    *   If Google asks you to configure a "consent screen", don't worry. This is the permission screen you'll see.
    *   Select **"External"** and click **CREATE**.
    *   Fill in the required fields:
        *   **App Name:** `ShopSathi Backups`
        *   **User support email:** (Your email address)
        *   **Developer contact email:** (Your email address)
    *   Click "Save and Continue" through the next pages until you're back on the "Credentials" page. Then, repeat step 3.

5.  **Configure the Client ID Form**
    *   **Application type**: Choose **"Web application"**.
    *   **Name**: Type a name, like `ShopSathi Backup Service`.
    *   Under the **"Authorized JavaScript origins"** section, click **"+ ADD URI"**. This is a security step to tell Google which websites are allowed to use this key.
        *   Enter the web address where you access your ShopSathi app (e.g., `https://my-business.com`).
        *   If you are testing on your own computer, add `http://localhost:8080` (or whichever port you use).
    *   Click the blue **"CREATE"** button at the bottom.

6.  **Copy and Store Your Client ID**
    *   A window will appear showing your **"Client ID"**.
    *   **Click the copy icon** next to it.
    *   Go back to your hosting service's "Environment Variables" section.
    *   Create a new variable named `GOOGLE_CLIENT_ID`.
    *   Paste the copied Client ID as the value and save.

---

### You're all set!

That's it! Once you've set both the `API_KEY` and `GOOGLE_CLIENT_ID` variables, restart or redeploy your app. The AI and Google Drive backup features should now be active.

### WhatsApp and Data Notes

*   **WhatsApp**: The WhatsApp feature is ready to use out-of-the-box! No setup is needed. Just make sure your customers' phone numbers are saved with their country code (without the `+` symbol or any spaces/dashes).
*   **Data Storage**: Your app's data is safely stored in your own browser's Local Storage. This means it's private to you. To prevent data loss if you clear your browser history or switch computers, please use the backup features you just enabled!

---
---

# স্মার্ট বৈশিষ্ট্যের জন্য শপসাথী সেটআপ গাইড (Bengali Guide)

স্বাগতম! শপসাথীর স্মার্ট বৈশিষ্ট্যগুলি, যেমন **AI Assistant** এবং স্বয়ংক্রিয় **Google Drive Backups** আনলক করতে, আপনাকে অ্যাপটিকে Google-এর পরিষেবাগুলির সাথে সংযুক্ত করতে হবে।

এই গাইডটি আপনাকে Google থেকে প্রয়োজনীয় "কী" (Key) পেতে সাহায্য করবে। এটি দেখতে প্রযুক্তিগত মনে হলেও, এটি কেবল কয়েকটি ক্লিক এবং কপি করার ধাপ। **কোনো কোডিংয়ের প্রয়োজন নেই!**

---

### এই গাইড থেকে আপনি কী পাবেন

আপনি Google-এর ওয়েবসাইট থেকে দুটি গোপন কী পাবেন:

1.  **API Key**: এটি AI বৈশিষ্ট্যগুলি (যেমন AI Assistant) সক্রিয় করে।
2.  **Google Client ID**: এটি অ্যাপটিকে আপনার ব্যক্তিগত Google Drive-এ নিরাপদে ডেটা ব্যাকআপ করার অনুমতি দেয়।

### কী-গুলি কোথায় রাখবেন: এনভায়রনমেন্ট ভেরিয়েবল ব্যবহার করে

আপনার গোপন কী-গুলি সুরক্ষিত রাখতে, আমরা সেগুলিকে সরাসরি কোনও কোড ফাইলে পেস্ট করব **না**। এর পরিবর্তে, আমরা সমস্ত আধুনিক ওয়েব হোস্টিং পরিষেবা দ্বারা প্রদত্ত একটি নিরাপদ বৈশিষ্ট্য ব্যবহার করব, যার নাম **এনভায়রনমেন্ট ভেরিয়েবল (Environment Variables)**।

এগুলিকে আপনার অ্যাপের জন্য সুরক্ষিত ডিজিটাল লকার হিসাবে ভাবুন। আপনার অ্যাপ জানে কীভাবে এই লকারগুলি খুলে প্রয়োজন অনুযায়ী কী-গুলি নিতে হয়, কিন্তু কী-গুলি নিজেরা পাবলিক-ফেসিং কোডে সংরক্ষিত থাকে না। সংবেদনশীল তথ্য পরিচালনা করার জন্য এটিই ইন্ডাস্ট্রি-স্ট্যান্ডার্ড পদ্ধতি।

আপনাকে আপনার হোস্টিং প্রদানকারীর সেটিংসে দুটি কী যোগ করতে হবে। প্রক্রিয়াটি সাধারণত সব জায়গায় একই রকম:

1.  **আপনার হোস্টিং প্রদানকারীর ওয়েবসাইটে লগ ইন করুন** (যেমন, Vercel, Netlify, Render, ইত্যাদি)।
2.  আপনার **শপসাথী প্রকল্পের** ড্যাশবোর্ডে নেভিগেট করুন।
3.  একটি **"Settings"** ট্যাব বা বিভাগ সন্ধান করুন।
4.  সেটিংসের ভিতরে, **"Environment Variables"**, "Secrets", বা "Config Vars" নামক একটি উপ-বিভাগ খুঁজুন।
5.  আপনি একটি নতুন ভেরিয়েবল যোগ করার অপশন দেখতে পাবেন। আপনাকে এটি দুবার করতে হবে:

    *   **আপনার API Key-এর জন্য:**
        *   "Add New Variable" ক্লিক করুন।
        *   **Name** (বা **Key**) ক্ষেত্রে, ঠিক টাইপ করুন: `API_KEY`
        *   **Value** (বা **Secret**) ক্ষেত্রে, Google AI Studio থেকে কপি করা **API Key**-টি পেস্ট করুন।
        *   এটি সংরক্ষণ করুন।

    *   **আপনার Client ID-এর জন্য:**
        *   আবার "Add New Variable" ক্লিক করুন।
        *   **Name** (বা **Key**) ক্ষেত্রে, ঠিক টাইপ করুন: `GOOGLE_CLIENT_ID`
        *   **Value** (বা **Secret**) ক্ষেত্রে, Google Cloud Console থেকে কপি করা **Client ID**-টি পেস্ট করুন।
        *   এটিও সংরক্ষণ করুন।

6.  **গুরুত্বপূর্ণ: আপনার অ্যাপটি রিডেপ্লয় (Redeploy) করুন!** আপনার ভেরিয়েবলগুলি সংরক্ষণ করার পরে, আপনাকে অবশ্যই আপনার অ্যাপের একটি নতুন "deployment" বা "build" শুরু করতে হবে। নতুন কী-গুলিতে অ্যাক্সেস দেওয়ার জন্য আপনার হোস্টিং পরিষেবাটিকে অ্যাপটি পুনরায় চালু করতে হবে। একটি "Deployments" ট্যাব এবং "Redeploy" বা "Trigger Deploy" করার জন্য একটি বোতাম সন্ধান করুন।

নতুন ডেপ্লয়মেন্ট সম্পূর্ণ হয়ে গেলে, আপনার অ্যাপ কী-গুলিতে অ্যাক্সেস পাবে, এবং স্মার্ট বৈশিষ্ট্যগুলি সক্রিয় হয়ে যাবে।

---

## পার্ট ১: আপনার Google API Key সংগ্রহ (AI বৈশিষ্ট্যের জন্য)

এই কী অ্যাপের সমস্ত AI বৈশিষ্ট্য সক্রিয় করে।

1.  **Google AI Studio খুলুন**
    *   আপনার ওয়েব ব্রাউজারে, [Google AI Studio ওয়েবসাইটে](https://aistudio.google.com/) যান।
    *   প্রয়োজনে আপনার Google অ্যাকাউন্ট দিয়ে সাইন ইন করুন।

2.  **আপনার API Key সংগ্রহ করুন**
    *   সাধারণত উপরের-বাম কোণে থাকা **"Get API key"** বোতামে ক্লিক করুন।
    *   একটি ছোট উইন্ডো পপ আপ হবে। **"Create API key in new project"** লেখা বোতামটিতে ক্লিক করুন।
    *   সফল! আপনি অক্ষর এবং সংখ্যার একটি দীর্ঘ স্ট্রিং দেখতে পাবেন। এটিই আপনার API Key।
    *   কী-টির পাশের **কপি আইকনে ক্লিক করে** এটি কপি করুন।

3.  **আপনার API Key সংরক্ষণ করুন**
    *   আপনার হোস্টিং পরিষেবার "Environment Variables" বিভাগে যান।
    *   `API_KEY` নামে একটি নতুন ভেরিয়েবল তৈরি করুন।
    *   কপি করা কী-টি এই ভেরিয়েবলের মান হিসাবে পেস্ট করুন এবং সংরক্ষণ করুন।

---

## পার্ট ২: আপনার Google Client ID সংগ্রহ (ব্যাকআপের জন্য)

এই ID অ্যাপটিকে আপনার Google Drive-এর একটি ব্যক্তিগত ফোল্ডারে ব্যাকআপ ফাইল সংরক্ষণ করার জন্য আপনার অনুমতি চাইতে দেয়।

1.  **Google Cloud Console খুলুন**
    *   [Google Cloud Console-এ](https://console.cloud.google.com/) যান।
    *   পৃষ্ঠার শীর্ষে, আপনি একটি প্রকল্পের নাম দেখতে পাবেন (এটি "Generative Language Client" হতে পারে)। নিশ্চিত করুন যে এই প্রকল্পটি নির্বাচিত আছে।

2.  **Credentials পৃষ্ঠায় যান**
    *   বাম দিকের মেনুতে, এটি খোলার জন্য আপনাকে 'হ্যামবার্গার' আইকনে (☰) ক্লিক করতে হতে পারে।
    *   **APIs & Services** খুঁজে বের করে ক্লিক করুন, এবং তারপর **Credentials**-এ ক্লিক করুন।

3.  **Client ID তৈরি করুন**
    *   পৃষ্ঠার শীর্ষে থাকা **"+ CREATE CREDENTIALS"** বোতামে ক্লিক করুন এবং তালিকা থেকে **"OAuth client ID"** নির্বাচন করুন।

4.  **প্রথমবার সেটআপ (যদি প্রয়োজন হয়)**
    *   যদি Google আপনাকে একটি "consent screen" কনফিগার করতে বলে, চিন্তা করবেন না। এটি হল অনুমতির স্ক্রিন যা আপনি দেখতে পাবেন।
    *   **"External"** নির্বাচন করুন এবং **CREATE** ক্লিক করুন।
    *   প্রয়োজনীয় ক্ষেত্রগুলি পূরণ করুন:
        *   **App Name:** `ShopSathi Backups`
        *   **User support email:** (আপনার ইমেল ঠিকানা)
        *   **Developer contact email:** (আপনার ইমেল ঠিকানা)
    *   পরবর্তী পৃষ্ঠাগুলিতে "Save and Continue" ক্লিক করে এগিয়ে যান যতক্ষণ না আপনি "Credentials" পৃষ্ঠায় ফিরে আসেন। তারপর, ৩ নং ধাপটি পুনরাবৃত্তি করুন।

5.  **Client ID ফর্মটি কনফিগার করুন**
    *   **Application type**: **"Web application"** নির্বাচন করুন।
    *   **Name**: একটি নাম টাইপ করুন, যেমন `ShopSathi Backup Service`।
    *   **"Authorized JavaScript origins"** বিভাগের অধীনে, **"+ ADD URI"** ক্লিক করুন। এটি একটি নিরাপত্তা পদক্ষেপ যা Google-কে জানায় কোন ওয়েবসাইটগুলি এই কী ব্যবহার করার অনুমতিপ্রাপ্ত।
        *   আপনি যেখানে আপনার শপসাথী অ্যাপ অ্যাক্সেস করেন সেই ওয়েব ঠিকানাটি লিখুন (যেমন, `https://my-business.com`)।
        *   আপনি যদি নিজের কম্পিউটারে পরীক্ষা করেন, তাহলে `http://localhost:8080` (বা আপনি যে পোর্ট ব্যবহার করেন) যোগ করুন।
    *   নীচের নীল **"CREATE"** বোতামে ক্লিক করুন।

6.  **আপনার Client ID কপি এবং সংরক্ষণ করুন**
    *   একটি উইন্ডো আপনার **"Client ID"** প্রদর্শন করবে।
    *   এর পাশের **কপি আইকনে ক্লিক করুন**।
    *   আপনার হোস্টিং পরিষেবার "Environment Variables" বিভাগে ফিরে যান।
    *   `GOOGLE_CLIENT_ID` নামে একটি নতুন ভেরিয়েবল তৈরি করুন।
    *   কপি করা Client ID-টি মান হিসাবে পেস্ট করুন এবং সংরক্ষণ করুন।

---

### আপনি এখন প্রস্তুত!

এটাই! `API_KEY` এবং `GOOGLE_CLIENT_ID` উভয় ভেরিয়েবল সেট করার পরে, আপনার অ্যাপটি পুনরায় চালু বা রিডেপ্লয় করুন। AI এবং Google Drive ব্যাকআপ বৈশিষ্ট্যগুলি এখন সক্রিয় হওয়া উচিত।

### WhatsApp এবং ডেটা নোট

*   **WhatsApp**: WhatsApp বৈশিষ্ট্যটি ব্যবহারের জন্য প্রস্তুত! কোনো সেটআপের প্রয়োজন নেই। শুধু নিশ্চিত করুন যে আপনার গ্রাহকদের ফোন নম্বরগুলি তাদের দেশের কোড সহ ( `+` চিহ্ন বা কোনো স্পেস/ড্যাশ ছাড়া) সংরক্ষিত আছে।
*   **ডেটা স্টোরেজ**: আপনার অ্যাপের ডেটা আপনার নিজের ব্রাউজারের Local Storage-এ নিরাপদে সংরক্ষিত থাকে। এর মানে এটি আপনার জন্য ব্যক্তিগত। আপনি যদি আপনার ব্রাউজারের ইতিহাস পরিষ্কার করেন বা কম্পিউটার পরিবর্তন করেন তবে ডেটা হারানো রোধ করতে, অনুগ্রহ করে আপনি এইমাত্র সক্রিয় করা ব্যাকআপ বৈশিষ্ট্যগুলি ব্যবহার করুন!