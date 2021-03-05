import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import BBCode from "bbcode-to-react";
import { Button, Grid, Image } from "@chakra-ui/react";
import {
  BlueprintBook,
  Blueprint,
  BlueprintPage,
  getBlueprintBookById,
  getBlueprintById,
  getBlueprintPageById,
  isBlueprintPageUserFavorite,
} from "@factorio-sites/database";
import { BlueprintStringData, timeLogger } from "@factorio-sites/common-utils";
import { chakraResponsive, parseBlueprintStringClient } from "@factorio-sites/web-utils";
import { Panel } from "../../components/Panel";
import { Markdown } from "../../components/Markdown";
import { BookChildTree } from "../../components/BookChildTree";
import { CopyButton } from "../../components/CopyButton";
import { ImageEditor } from "../../components/ImageEditor";
import { useAuth } from "../../providers/auth";
import { pageHandler } from "../../utils/page-handler";
import styled from "@emotion/styled";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";

type Selected =
  | { type: "blueprint"; data: Pick<Blueprint, "id" | "blueprint_hash" | "image_hash"> }
  | { type: "blueprint_book"; data: Pick<BlueprintBook, "id" | "blueprint_hash"> };

interface IndexProps {
  image_exists: boolean;
  selected: Selected;
  blueprint: Blueprint | null;
  blueprint_book: BlueprintBook | null;
  blueprint_page: BlueprintPage;
  favorite: boolean;
}

const StyledTable = styled.table`
  td {
    border: 1px solid #909090;
  }
  td:not(.no-padding) {
    padding: 5px 10px;
  }
`;

export const Index: NextPage<IndexProps> = ({
  image_exists,
  selected,
  blueprint,
  blueprint_book,
  blueprint_page,
  favorite,
}) => {
  const auth = useAuth();
  // const [imageZoom, setImageZoom] = useState(false);
  const [blueprintString, setBlueprintString] = useState<string | null>(null);
  const [data, setData] = useState<BlueprintStringData | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [isFavorite, setIsFavorite] = useState(favorite);

  const selectedHash = selected.data.blueprint_hash;

  const onClickFavorite = async () => {
    const result = await fetch("/api/user/favorite", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ blueprint_page_id: blueprint_page.id }),
    }).then((res) => res.json());
    setIsFavorite(result.favorite);
  };

  useEffect(() => {
    fetch(`/api/string/${selectedHash}`)
      .then((res) => res.text())
      .then((string) => {
        setShowJson(false);
        setBlueprintString(string);
        if (selected.type === "blueprint") {
          const data = parseBlueprintStringClient(string);
          setData(data);
        } else {
          setData(null);
        }
      })
      .catch((reason) => console.error(reason));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHash]);

  useEffect(() => {
    console.log({
      image_exists,
      selected,
      blueprint,
      blueprint_book,
      blueprint_page,
    });
  }, []);

  // const renderImage = () => {
  //   let render: ReactNode;
  //   if (selected.type === "blueprint_book") {
  //     render = <div>Can't show image for a book, select a blueprint to the the image</div>;
  //   } else if (!image_exists) {
  //     render = <div>The image is not generated yet</div>;
  //   } else if (imageZoom) {
  //     render = (
  //       <FullscreenImage
  //         close={() => setImageZoom(false)}
  //         alt="blueprint"
  //         src={`https://storage.googleapis.com/blueprint-images/${selected.data.image_hash}.webp`}
  //       />
  //     );
  //   } else {
  //     render = (
  //       <div onClick={() => setImageZoom(true)}>
  //         <img
  //           alt="blueprint"
  //           src={`https://storage.googleapis.com/blueprint-images/${selected.data.image_hash}.webp`}
  //         />
  //       </div>
  //     );
  //   }
  //   return <div css={imageStyle}>{render}</div>;
  // };

  return (
    <Grid
      margin="0.7rem"
      templateColumns={chakraResponsive({ mobile: "1fr", desktop: "1fr 1fr" })}
      gap={6}
    >
      <Panel
        title={
          <div css={{ position: "relative" }}>
            <span>{blueprint_page.title}</span>
            {auth && (
              <Button
                colorScheme="green"
                onClick={onClickFavorite}
                css={{ position: "absolute", right: "10px", top: "-7px", height: "35px" }}
              >
                Favorite {isFavorite ? <AiFillHeart /> : <AiOutlineHeart />}
              </Button>
            )}
          </div>
        }
        gridColumn="1"
      >
        {blueprint_book ? (
          <>
            <div>This string contains a blueprint book </div>
            <br />
            <div css={{ maxHeight: "400px", overflow: "auto" }}>
              <BookChildTree
                child_tree={[
                  {
                    id: blueprint_book.id,
                    name: blueprint_book.label,
                    type: "blueprint_book",
                    children: blueprint_book.child_tree,
                  },
                ]}
                base_url={`/blueprint/${blueprint_page.id}`}
                selected_id={selected.data.id}
              />
            </div>
          </>
        ) : blueprint ? (
          <Markdown>{blueprint_page.description_markdown}</Markdown>
        ) : null}
      </Panel>
      <Panel title={"Info"}>
        <StyledTable>
          <tbody>
            <tr>
              <td>User</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Tags</td>
              <td>{blueprint_page.tags.join(", ")}</td>
            </tr>
            <tr>
              <td>Last updated</td>
              <td>{new Date(blueprint_page.updated_at * 1000).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td>Created</td>
              <td>{new Date(blueprint_page.created_at * 1000).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td>Favorites</td>
              <td>{blueprint_page.favorite_count || "0"}</td>
            </tr>
          </tbody>
        </StyledTable>
      </Panel>
      <Panel
        title={"Image"}
        gridColumn={chakraResponsive({ mobile: "1", desktop: "2" })}
        gridRow={chakraResponsive({ mobile: "1", desktop: "1 / span 2" })}
      >
        {/* {renderImage()} */}
        {blueprintString && <ImageEditor string={blueprintString}></ImageEditor>}
      </Panel>
      {blueprint_book && (
        <Panel
          title="Description"
          gridColumn={chakraResponsive({ mobile: "1", desktop: "1 / span 2" })}
        >
          <Markdown>{blueprint_page.description_markdown}</Markdown>
        </Panel>
      )}
      {selected.type === "blueprint" && data?.blueprint && (
        <Panel
          title={
            (
              <span>
                Entities for{" "}
                {data.blueprint.label ? BBCode.toReact(data.blueprint.label) : "blueprint"}
              </span>
            ) as any
          }
          gridColumn={chakraResponsive({ mobile: "1", desktop: "1 / span 2" })}
        >
          <StyledTable>
            <tbody>
              {Object.entries(
                data.blueprint.entities.reduce<Record<string, number>>((entities, entity) => {
                  if (entities[entity.name]) {
                    entities[entity.name]++;
                  } else {
                    entities[entity.name] = 1;
                  }
                  return entities;
                }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .map(([entry_name, entry]) => (
                  <tr key={entry_name} css={{}}>
                    <td className="no-padding">
                      <Image
                        alt={entry_name.replace(/-/g, " ")}
                        src={`https://factorioprints.com/icons/${entry_name}.png`}
                        fallbackSrc="https://storage.googleapis.com/factorio-blueprints-assets/error-icon.png"
                        width="32px"
                        height="32px"
                      />
                    </td>
                    <td>{entry_name}</td>
                    <td>{entry}</td>
                  </tr>
                ))}
            </tbody>
          </StyledTable>
        </Panel>
      )}
      <Panel title="string" gridColumn={chakraResponsive({ mobile: "1", desktop: "1 / span 2" })}>
        <>
          {blueprintString && <CopyButton content={blueprintString} marginBottom="0.5rem" />}
          <textarea
            value={blueprintString || "Loading..."}
            readOnly
            css={{
              width: "100%",
              height: "100px",
              resize: "none",
              color: "#fff",
              backgroundColor: "#414040",
            }}
          />
        </>
      </Panel>
      <Panel title="json" gridColumn={chakraResponsive({ mobile: "1", desktop: "1 / span 2" })}>
        {showJson ? (
          !data ? (
            <div>Loading...</div>
          ) : (
            <>
              <Button
                colorScheme="green"
                css={{ position: "absolute", right: "65px" }}
                onClick={() => {
                  setShowJson(false);
                  if (selected.type === "blueprint_book") {
                    setData(null);
                  }
                }}
              >
                hide
              </Button>
              <pre css={{ maxHeight: "500px", overflowY: "scroll" }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            </>
          )
        ) : (
          <Button
            colorScheme="green"
            onClick={() => {
              setShowJson(true);
              if (selected.type === "blueprint_book") {
                fetch(`/api/string/${selectedHash}`)
                  .then((res) => res.text())
                  .then((string) => {
                    const data = parseBlueprintStringClient(string);
                    setData(data);
                  });
              }
            }}
          >
            show
          </Button>
        )}
      </Panel>
    </Grid>
  );
};

export const getServerSideProps = pageHandler(async (context, { session }) => {
  const throwError = (message: string) => {
    if (!blueprint_page && context.res) {
      context.res.statusCode = 404;
      context.res.end(JSON.stringify({ error: message }));
      return { props: {} };
    }
  };

  const tl = timeLogger("getServerSideProps");
  const selected_id = context.query.selected ? (context.query.selected as string) : null;
  const type = context.query.type ? (context.query.type as string) : null;
  const blueprintId = context.query.blueprintId ? (context.query.blueprintId as string) : null;

  if (!blueprintId) return throwError("Blueprint ID not found");

  const blueprint_page = await getBlueprintPageById(blueprintId);
  tl("getBlueprintPageById");

  if (!blueprint_page) return throwError("Blueprint page not found");

  let blueprint: IndexProps["blueprint"] = null;
  let blueprint_book: IndexProps["blueprint_book"] = null;
  let selected!: IndexProps["selected"];
  let selected_blueprint!: Blueprint | null;
  let selected_blueprint_book!: BlueprintBook | null;

  if (blueprint_page.blueprint_id) {
    blueprint = await getBlueprintById(blueprint_page.blueprint_id);
    selected_blueprint = blueprint;
    tl("getBlueprintById");
  } else if (blueprint_page.blueprint_book_id) {
    blueprint_book = await getBlueprintBookById(blueprint_page.blueprint_book_id);
    if (selected_id && type === "book") {
      selected_blueprint_book = await getBlueprintBookById(selected_id);
      tl("getBlueprintBookById");
    } else if (selected_id && type !== "book") {
      selected_blueprint = await getBlueprintById(selected_id);
      tl("getBlueprintById");
    } else if (blueprint_book) {
      selected_blueprint_book = blueprint_book;
    }
  }

  if (selected_blueprint) {
    selected = {
      type: "blueprint",
      data: {
        id: selected_blueprint.id,
        blueprint_hash: selected_blueprint.blueprint_hash,
        image_hash: selected_blueprint.image_hash,
      },
    };
  } else if (selected_blueprint_book) {
    selected = {
      type: "blueprint_book",
      data: {
        id: selected_blueprint_book.id,
        blueprint_hash: selected_blueprint_book.blueprint_hash,
      },
    };
  }

  // const image_exists =
  //   selected.type === "blueprint" ? await hasBlueprintImage(selected.data.image_hash) : false;

  const favorite = session
    ? !!(await isBlueprintPageUserFavorite(session.user.id, blueprint_page.id))
    : false;

  return {
    props: {
      image_exists: false,
      blueprint,
      blueprint_book,
      selected,
      blueprint_page,
      favorite,
    } as IndexProps,
  };
});

export default Index;