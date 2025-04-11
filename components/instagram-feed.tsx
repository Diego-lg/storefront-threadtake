import React from "react";
import { Instagram } from "lucide-react";
import Image from "next/image";

const instagramPosts = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
    likes: 124,
    comments: 8,
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
    likes: 98,
    comments: 5,
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
    likes: 156,
    comments: 12,
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
    likes: 87,
    comments: 4,
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1566206091558-7f218b696731?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
    likes: 213,
    comments: 18,
  },
  {
    id: 6,
    image:
      "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
    likes: 145,
    comments: 9,
  },
];

interface InstagramPost {
  id: number;
  image: string;
  likes: number;
  comments: number;
}

interface InstagramFeedProps {
  posts?: InstagramPost[];
}

function InstagramFeed({ posts = instagramPosts }: InstagramFeedProps) {
  return (
    <div className="bg-background py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Follow Us on Instagram
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground mb-6">
            Tag your photos with #Thread Heaven for a chance to be featured
          </p>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-pink-600 font-medium hover:text-pink-700"
          >
            <Instagram size={20} className="mr-2" />
            @Thread Heaven
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {posts.map((post) => (
            <a
              key={post.id}
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-w-1 aspect-h-1 block overflow-hidden"
            >
              <Image
                src={post.image}
                alt="Instagram post"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                width={500}
                height={500}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="text-white flex items-center space-x-4">
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    {post.likes}
                  </span>
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    {post.comments}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InstagramFeed;
