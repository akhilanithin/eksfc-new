import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useLazyQuery } from '@apollo/react-hooks';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import ALink from '~/components/features/custom-link';

import { GET_PRODUCTS } from '~/server/queries';
import withApollo from '~/server/apollo';

import { toDecimal } from '~/utils';

import useFetch from "~/components/partials/shop/hooks/useFetch";

function SearchForm() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    // const [searchProducts, { data }] = useLazyQuery(GET_PRODUCTS);

    const [timer, setTimer] = useState('null');

    const [filteredResults, setFilteredResults] = useState([]);

    const timerRef = useRef<NodeJS.Timeout | null>(null);


    // console.log(filteredResults);
    


    const productURL = process.env.NEXT_PUBLIC_PRODUCT_URL || '';
    const productToken = process.env.NEXT_PUBLIC_PRODUCT_TOKEN || '';

    const { data, loading, error } = useFetch(productURL, productToken);


    const products = data?.data || [];

    const filterActiveProducts = (products) => products?.filter(item => !item?.status) || [];

    const getFilteredResults = (searchTerm) => {
        const activeProducts = filterActiveProducts(products);
        return activeProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    useEffect(() => {
        document.querySelector("body").addEventListener("click", onBodyClick);

        return (() => {
            document.querySelector("body").removeEventListener("click", onBodyClick);
        })
    }, [])

    useEffect(() => {
        setSearch("");
    }, [router.query.slug])
    

 
    useEffect(() => {
        if (search.length > 2) {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }
          
          timerRef.current = setTimeout(() => {
            const results = getFilteredResults(search);
            setFilteredResults(results);
          }, 50);
        } else {
          setFilteredResults([]); // Clear results if search term is too short
        }
    
        // Clean up the timer when the component is unmounted or when search changes
        return () => {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }
        };
      }, [search]); 


    useEffect(() => {
        document.querySelector('.header-search.show-results') && document.querySelector('.header-search.show-results').classList.remove('show-results');
    }, [router.pathname])

    function removeXSSAttacks(html) {
        const SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

        // Removing the <script> tags
        while (SCRIPT_REGEX.test(html)) {
            html = html.replace(SCRIPT_REGEX, "");
        }

        // Removing all events from tags...
        html = html.replace(/ on\w+="[^"]*"/g, "");

        return {
            __html: html
        }
    }

    function matchEmphasize(name) {
        let regExp = new RegExp(search, "i");
        return name.replace(
            regExp,
            (match) => "<strong>" + match + "</strong>"
        );
    }

    function showSearchBox(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.closest('.header-search').classList.toggle('show');
    }

    function onBodyClick(e) {
        if (e.target.closest('.header-search')) return e.target.closest('.header-search').classList.contains('show-results') || e.target.closest('.header-search').classList.add('show-results');

        document.querySelector('.header-search.show') && document.querySelector('.header-search.show').classList.remove('show');
        document.querySelector('.header-search.show-results') && document.querySelector('.header-search.show-results').classList.remove('show-results');
    }

    function onSearchChange(e) {
        setSearch(e.target.value);
    }

    function onSubmitSearchForm(e) {
        e.preventDefault();

        router.push({
            pathname: '/shop',
            query: {
                search: search
            }
        });
    }


    const PRODUCT_IMAGE_BASEURL = process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BASEURL;

    const variations = Array.isArray(filteredResults?.variation) ? filteredResults.variation : [filteredResults.variation];
    const discounts = variations.flatMap(variation => variation?.offers || []);
    const discount = discounts.length > 0 ? discounts[0] : null;
    const discountValue = discount ? discount.discount : 0;
    const discountPrice = discount ? discount.price : null;
    const basePrice = variations[0]?.price || 0;
    const showDiscountedPrice = discountPrice && discountPrice < basePrice;


    return (      
        <div className="header-search hs-toggle d-block">
            <ALink href="#" className="search-toggle d-flex align-items-center" role="button"><i className="d-icon-search"></i></ALink>
            <form action="#" method="get" onSubmit={onSubmitSearchForm} className="input-wrapper">
                <input type="text" className="form-control" name="search" autoComplete="off" value={search} onChange={onSearchChange}
                    placeholder="Search..." required onClick={showSearchBox} />

                <button className="btn btn-search" type="submit">
                    <i className="d-icon-search"></i>
                </button>
                <div className="live-search-list bg-grey-light scrollable">


                    {search?.length > 2 && filteredResults && filteredResults?.map((product, index) => (

                   


                        <ALink href={`/product/default/${product?.id}`} className="autocomplete-suggestion" key={`search-result-${index}`}>
                            <LazyLoadImage  src={`${PRODUCT_IMAGE_BASEURL}/products/${product.image}`} width={40} height={40} alt="product" />
                            <div className="search-name" dangerouslySetInnerHTML={removeXSSAttacks(matchEmphasize(product.name))}></div>
                            <span className="search-price">

{/* 
                                {
                                    product.price[0] !== product.price[1] ?
                                        product.variants.length === 0 ?
                                            <>
                                                <span className="new-price mr-1">${toDecimal(product.price[0])}</span>
                                                <span className="old-price">${toDecimal(product.price[1])}</span>
                                            </>
                                            :
                                            < span className="new-price">${toDecimal(product.price[0])} – ${toDecimal(product.price[1])}</span>
                                        : <span className="new-price">${toDecimal(product.price[0])}</span>
                                } */}


                                {showDiscountedPrice ? (
                                    <>
                                        <del className="old-price"> AED {toDecimal(basePrice)}</del>
                                        <ins className="new-price"> AED {toDecimal(discountPrice)}</ins>
                                    </>
                                ) : (
                                    <ins className="new-price">AED {toDecimal(basePrice)}</ins>
                                )}

                            </span>
                        </ALink>



                    ))
                    }



                </div>
            </form>
        </div>
    );
}

export default withApollo({ ssr: typeof window === 'undefined' })(SearchForm);